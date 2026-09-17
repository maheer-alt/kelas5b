import { supabase } from "./supabase.js";


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


let currentUser = null;


/* =========================================
   SIDEBAR
========================================= */

async function loadSidebar() {

    try {

        const response =
            await fetch("sidebar.html");

        sidebar.innerHTML =
            await response.text();

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
   MESSAGE
========================================= */

function showAvatarMessage(
    message,
    isError = false
) {

    avatarMessage.textContent =
        message;

    avatarMessage.classList.toggle(
        "error",
        isError
    );

}


/* =========================================
   SHOW LETTER
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
   SHOW IMAGE
========================================= */

function showAvatarImage(url) {

    if (!url) {
        return;
    }

    avatar.classList.add(
        "has-image"
    );

    avatar.innerHTML = "";

    const image =
        document.createElement("img");

    image.src =
        url;

    image.alt =
        "Foto profil";

    image.loading =
        "lazy";

    image.onerror = () => {

        console.error(
            "Avatar gagal dimuat:",
            url
        );

        avatar.classList.remove(
            "has-image"
        );

        avatar.innerHTML = "";

        avatar.textContent =
            currentUser
                ? "?"
                : "G";

    };

    avatar.appendChild(
        image
    );

}


/* =========================================
   GET AVATAR PUBLIC URL
========================================= */

function getAvatarUrl(userId) {

    const filePath =
        `${userId}/avatar.webp`;

    const {
        data
    } =
        supabase
            .storage
            .from("avatars")
            .getPublicUrl(
                filePath
            );

    if (!data || !data.publicUrl) {

        return null;
    }

    /*
       Timestamp membuat browser tidak
       menggunakan URL gambar lama dari cache.
    */

    return (
        data.publicUrl +
        "?t=" +
        Date.now()
    );

}


/* =========================================
   CHECK AVATAR EXISTS
========================================= */

async function loadAvatar(userId, name) {

    const filePath =
        `${userId}/avatar.webp`;

    try {

        /*
           Cek file di folder user.
        */

        const {
            data,
            error
        } =
            await supabase
                .storage
                .from("avatars")
                .list(
                    userId,
                    {
                        limit: 10
                    }
                );


        if (
            error ||
            !data
        ) {

            console.log(
                "Avatar belum tersedia."
            );

            showAvatarLetter(
                name
            );

            return;
        }


        const avatarFile =
            data.find(
                file =>
                    file.name ===
                    "avatar.webp"
            );


        if (!avatarFile) {

            showAvatarLetter(
                name
            );

            return;
        }


        const avatarUrl =
            getAvatarUrl(
                userId
            );


        if (avatarUrl) {

            showAvatarImage(
                avatarUrl
            );

        } else {

            showAvatarLetter(
                name
            );

        }

    } catch (error) {

        console.error(
            "Load avatar error:",
            error
        );

        showAvatarLetter(
            name
        );

    }

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

        avatarUploadButton.style.display =
            "none";

        document.querySelector(
            ".avatar-hint"
        ).style.display =
            "none";

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


    const name =
        profile?.full_name ||
        user.email.split("@")[0];


    const username =
        profile?.username ||
        "user";


    /* =====================================
       DISPLAY PROFILE
    ===================================== */

    document.getElementById(
        "fullName"
    ).textContent =
        name;


    document.getElementById(
        "username"
    ).textContent =
        "@" + username;


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
       LOAD AVATAR
    ===================================== */

    await loadAvatar(
        user.id,
        name
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


    if (!file) {
        return;
    }


    /* =====================================
       WEBP ONLY
    ===================================== */

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


    /* =====================================
       MAX 1 MB
    ===================================== */

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


        /* =================================
           PATH
        ================================= */

        const filePath =
            `${currentUser.id}/avatar.webp`;


        /* =================================
           UPLOAD
        ================================= */

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


        /* =================================
           PUBLIC URL
        ================================= */

        const avatarUrl =
            getAvatarUrl(
                currentUser.id
            );


        if (!avatarUrl) {

            throw new Error(
                "Public URL avatar tidak tersedia."
            );

        }


        /* =================================
           SAVE TO PROFILES
        ================================= */

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


        /* =================================
           DISPLAY
        ================================= */

        showAvatarImage(
            avatarUrl
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

avatarInput.addEventListener(
    "change",
    () => {

        const file =
            avatarInput.files[0];

        uploadAvatar(
            file
        );

    }
);


/* =========================================
   START
========================================= */

loadSidebar();

loadProfile();
