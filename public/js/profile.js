import { supabase } from "./supabase.js";


/* =========================================
   ELEMENT
========================================= */

const sidebar =
    document.getElementById("sidebar");

const avatar =
    document.getElementById("avatar");

const avatarInput =
    document.getElementById("avatarInput");

const avatarUploadButton =
    document.getElementById(
        "avatarUploadButton"
    );

const avatarMessage =
    document.getElementById(
        "avatarMessage"
    );

const editProfileButton =
    document.getElementById(
        "editProfileButton"
    );

const cancelEditButton =
    document.getElementById(
        "cancelEditButton"
    );

const editProfile =
    document.getElementById(
        "editProfile"
    );

const profileForm =
    document.getElementById(
        "profileForm"
    );

const nameInput =
    document.getElementById(
        "nameInput"
    );

const usernameInput =
    document.getElementById(
        "usernameInput"
    );

const bioInput =
    document.getElementById(
        "bioInput"
    );

const bioCounter =
    document.getElementById(
        "bioCounter"
    );

const editMessage =
    document.getElementById(
        "editMessage"
    );


let currentUser = null;
let currentProfile = null;


/* =========================================
   SIDEBAR
========================================= */

async function loadSidebar() {

    try {

        const response =
            await fetch("sidebar.html");

        sidebar.innerHTML =
            await response.text();

        sidebar
            .querySelector('a[href="profile.html"]')
            ?.classList.add("active");

        const logout =
            document.getElementById(
                "logoutButton"
            );


        if (logout) {

            logout.addEventListener(
                "click",
                async () => {

                    await supabase.auth.signOut();

                    sessionStorage.removeItem(
                        "guestMode"
                    );

                    window.location.href =
                        "login.html";

                }
            );

        }

    } catch (error) {

        console.error(
            "Sidebar error:",
            error
        );

    }

}


/* =========================================
   AVATAR MESSAGE
========================================= */

function showAvatarMessage(
    message,
    isError = false
) {

    if (!avatarMessage) return;

    avatarMessage.textContent =
        message;

    avatarMessage.classList.toggle(
        "error",
        isError
    );

}


/* =========================================
   AVATAR LETTER
========================================= */

function showAvatarLetter(name) {

    avatar.classList.remove(
        "has-image"
    );

    avatar.innerHTML = "";

    avatar.textContent =
        name
            .charAt(0)
            .toUpperCase();

}


/* =========================================
   AVATAR IMAGE
========================================= */

function showAvatarImage(url) {

    if (!url) return;


    avatar.classList.add(
        "has-image"
    );

    avatar.innerHTML = "";


    const image =
        document.createElement("img");


    image.src = url;

    image.alt =
        "Foto profil";

    image.loading =
        "lazy";


    image.onerror = () => {

        console.error(
            "Avatar gagal dimuat:",
            url
        );

        showAvatarLetter(
            currentProfile?.full_name ||
            "U"
        );

    };


    avatar.appendChild(
        image
    );

}


/* =========================================
   GET AVATAR URL
========================================= */

function getAvatarUrl(userId) {

    const filePath =
        `${userId}/avatar.webp`;


    const { data } =
        supabase
            .storage
            .from("avatars")
            .getPublicUrl(
                filePath
            );


    if (
        !data ||
        !data.publicUrl
    ) {

        return null;

    }


    return data.publicUrl;

}


/* =========================================
   LOAD AVATAR
========================================= */

async function loadAvatar(
    userId,
    name
) {

    const avatarUrl =
        getAvatarUrl(userId);


    if (!avatarUrl) {

        showAvatarLetter(name);

        return;

    }


    /*
       Kita langsung memakai
       URL avatar berdasarkan:

       USER_ID/avatar.webp
    */


    showAvatarImage(
        avatarUrl +
        "?t=" +
        Date.now()
    );

}


/* =========================================
   UPLOAD AVATAR
========================================= */

async function uploadAvatar(file) {

    if (!currentUser) {

        showAvatarMessage(
            "Kamu belum login.",
            true
        );

        return;

    }


    if (!file) return;


    /* WEBP ONLY */

    if (
        file.type !==
        "image/webp"
    ) {

        showAvatarMessage(
            "Foto harus berformat WebP (.webp).",
            true
        );

        avatarInput.value = "";

        return;

    }


    /* MAX 1 MB */

    const maxSize =
        1 * 1024 * 1024;


    if (
        file.size >
        maxSize
    ) {

        showAvatarMessage(
            "Ukuran foto maksimal 1 MB.",
            true
        );

        avatarInput.value = "";

        return;

    }


    try {

        showAvatarMessage(
            "Mengupload foto..."
        );


        avatarUploadButton.style.pointerEvents =
            "none";

        avatarUploadButton.style.opacity =
            "0.5";


        /* PATH */

        const filePath =
            `${currentUser.id}/avatar.webp`;


        /* UPLOAD */

        const {
            error: uploadError
        } =
            await supabase
                .storage
                .from("avatars")
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            true,

                        contentType:
                            "image/webp"
                    }
                );


        if (uploadError) {

            throw uploadError;

        }


        /* CLEAN PUBLIC URL */

        const avatarUrl =
            getAvatarUrl(
                currentUser.id
            );


        if (!avatarUrl) {

            throw new Error(
                "Public URL avatar tidak tersedia."
            );

        }


        /* SAVE URL */

        const {
            error: profileError
        } =
            await supabase
                .from("profiles")
                .update({
                    avatar_url:
                        avatarUrl
                })
                .eq(
                    "id",
                    currentUser.id
                );


        if (profileError) {

            throw profileError;

        }


        /* DISPLAY */

        showAvatarImage(
            avatarUrl +
            "?t=" +
            Date.now()
        );


        showAvatarMessage(
            "✓ Foto profil berhasil diperbarui."
        );


    } catch (error) {

        console.error(
            "Avatar upload error:",
            error
        );


        showAvatarMessage(
            "Upload gagal: " +
            (
                error.message ||
                "Terjadi kesalahan."
            ),
            true
        );


    } finally {

        avatarInput.value = "";

        avatarUploadButton.style.pointerEvents =
            "auto";

        avatarUploadButton.style.opacity =
            "1";

    }

}


/* =========================================
   FILE INPUT
========================================= */

if (avatarInput) {

    avatarInput.addEventListener(
        "change",
        () => {

            const file =
                avatarInput.files[0];

            uploadAvatar(file);

        }
    );

}


/* =========================================
   EDIT MESSAGE
========================================= */

function showEditMessage(
    message,
    isError = false
) {

    if (!editMessage) return;


    editMessage.textContent =
        message;


    editMessage.classList.toggle(
        "error",
        isError
    );

}


/* =========================================
   OPEN EDIT PROFILE
========================================= */

function openEditor() {

    if (!currentProfile) return;


    nameInput.value =
        currentProfile.full_name ||
        "";


    usernameInput.value =
        currentProfile.username ||
        "";


    bioInput.value =
        currentProfile.bio ||
        "";


    updateBioCounter();

    showEditMessage("");


    editProfile.hidden =
        false;


    editProfile.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =========================================
   CLOSE EDIT PROFILE
========================================= */

function closeEditor() {

    editProfile.hidden =
        true;

    showEditMessage("");

}


/* =========================================
   BIO COUNTER
========================================= */

function updateBioCounter() {

    const length =
        bioInput.value.length;


    bioCounter.textContent =
        `${length}/500`;


    if (length >= 500) {

        bioCounter.style.color =
            "#ff5c5c";

    } else {

        bioCounter.style.color =
            "var(--yellow)";

    }

}


if (bioInput) {

    bioInput.addEventListener(
        "input",
        updateBioCounter
    );

}


/* =========================================
   EDIT BUTTON
========================================= */

if (editProfileButton) {

    editProfileButton.addEventListener(
        "click",
        openEditor
    );

}


/* =========================================
   CANCEL BUTTON
========================================= */

if (cancelEditButton) {

    cancelEditButton.addEventListener(
        "click",
        closeEditor
    );

}


/* =========================================
   SAVE PROFILE
========================================= */

if (profileForm) {

    profileForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            if (!currentUser) {

                showEditMessage(
                    "Kamu belum login.",
                    true
                );

                return;

            }


            const fullName =
                nameInput.value.trim();


            const username =
                usernameInput.value
                    .trim()
                    .toLowerCase();


            const bio =
                bioInput.value.trim();


            /* NAME */

            if (!fullName) {

                showEditMessage(
                    "Nama tidak boleh kosong.",
                    true
                );

                nameInput.focus();

                return;

            }


            if (
                fullName.length >
                50
            ) {

                showEditMessage(
                    "Nama maksimal 50 karakter.",
                    true
                );

                return;

            }


            /* USERNAME */

            if (!username) {

                showEditMessage(
                    "Username tidak boleh kosong.",
                    true
                );

                usernameInput.focus();

                return;

            }


            if (
                !/^[a-z0-9_]+$/.test(
                    username
                )
            ) {

                showEditMessage(
                    "Username hanya boleh huruf, angka, dan underscore.",
                    true
                );

                usernameInput.focus();

                return;

            }


            if (
                username.length <
                3
            ) {

                showEditMessage(
                    "Username minimal 3 karakter.",
                    true
                );

                return;

            }


            if (
                username.length >
                30
            ) {

                showEditMessage(
                    "Username maksimal 30 karakter.",
                    true
                );

                return;

            }


            /* BIO */

            if (
                bio.length >
                500
            ) {

                showEditMessage(
                    "Bio maksimal 500 karakter.",
                    true
                );

                return;

            }


            try {

                showEditMessage(
                    "Menyimpan perubahan..."
                );


                /* CHECK USERNAME */

                const {
                    data: existingUser,
                    error: usernameError
                } =
                    await supabase
                        .from("profiles")
                        .select("id")
                        .eq(
                            "username",
                            username
                        )
                        .neq(
                            "id",
                            currentUser.id
                        )
                        .maybeSingle();


                if (usernameError) {

                    throw usernameError;

                }


                if (existingUser) {

                    showEditMessage(
                        "Username tersebut sudah digunakan.",
                        true
                    );

                    usernameInput.focus();

                    return;

                }


                /* UPDATE */

                const {
                    error
                } =
                    await supabase
                        .from("profiles")
                        .update({
                            full_name:
                                fullName,

                            username:
                                username,

                            bio:
                                bio
                        })
                        .eq(
                            "id",
                            currentUser.id
                        );


                if (error) {

                    throw error;

                }


                /* UPDATE LOCAL */

                currentProfile.full_name =
                    fullName;

                currentProfile.username =
                    username;

                currentProfile.bio =
                    bio;


                /* UPDATE DISPLAY */

                document.getElementById(
                    "fullName"
                ).textContent =
                    fullName;


                document.getElementById(
                    "username"
                ).textContent =
                    "@" +
                    username;


                document.getElementById(
                    "username2"
                ).textContent =
                    username;


                document.getElementById(
                    "bio"
                ).textContent =
                    bio ||
                    "Belum ada bio.";


                /* UPDATE AVATAR LETTER */

                const hasAvatar =
                    avatar.classList.contains(
                        "has-image"
                    );


                if (!hasAvatar) {

                    showAvatarLetter(
                        fullName
                    );

                }


                showEditMessage(
                    "✓ Profile berhasil diperbarui."
                );


                setTimeout(
                    () => {
                        closeEditor();
                    },
                    800
                );


            } catch (error) {

                console.error(
                    "Update profile error:",
                    error
                );


                showEditMessage(
                    "Gagal menyimpan: " +
                    (
                        error.message ||
                        "Terjadi kesalahan."
                    ),
                    true
                );

            }

        }
    );

}


/* =========================================
   LOAD PROFILE
========================================= */

async function loadProfile() {

    const guest =
        sessionStorage.getItem(
            "guestMode"
        );


    /* =====================================
       GUEST
    ===================================== */

    if (guest === "true") {

        document.getElementById(
            "fullName"
        ).textContent =
            "Guest";


        document.getElementById(
            "username"
        ).textContent =
            "@guest";


        document.getElementById(
            "username2"
        ).textContent =
            "guest";


        document.getElementById(
            "email"
        ).textContent =
            "-";


        document.getElementById(
            "bio"
        ).textContent =
            "Mode Guest — profil demo.";


        showAvatarLetter("G");


        if (avatarUploadButton) {

            avatarUploadButton.style.display =
                "none";

        }


        const avatarHint =
            document.querySelector(
                ".avatar-hint"
            );


        if (avatarHint) {

            avatarHint.style.display =
                "none";

        }


        if (editProfileButton) {

            editProfileButton.style.display =
                "none";

        }


        return;

    }


    /* =====================================
       GET USER
    ===================================== */

    const {
        data: {
            user
        }
    } =
        await supabase.auth.getUser();


    if (!user) {

        window.location.href =
            "login.html";

        return;

    }


    currentUser =
        user;


    /* =====================================
       GET PROFILE
    ===================================== */

    const {
        data: profile,
        error
    } =
        await supabase
            .from("profiles")
            .select("*")
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


    if (error) {

        console.error(
            "Profile error:",
            error
        );

        return;

    }


    currentProfile =
        profile || {};


    const name =
        profile?.full_name ||
        user.email
            .split("@")[0];


    const username =
        profile?.username ||
        "user";


    /* =====================================
       DISPLAY
    ===================================== */

    document.getElementById(
        "fullName"
    ).textContent =
        name;


    document.getElementById(
        "username"
    ).textContent =
        "@" +
        username;


    document.getElementById(
        "username2"
    ).textContent =
        username;


    document.getElementById(
        "email"
    ).textContent =
        user.email;


    document.getElementById(
        "bio"
    ).textContent =
        profile?.bio ||
        "Belum ada bio.";


    /* =====================================
       AVATAR
    ===================================== */

    await loadAvatar(
        user.id,
        name
    );

}


/* =========================================
   START
========================================= */

loadSidebar();

loadProfile();
