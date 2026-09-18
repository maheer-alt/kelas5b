import { supabase } from "./supabase.js";


// ======================================================
// ELEMENT
// ======================================================

const sidebar =
    document.getElementById("sidebar");


// ======================================================
// SIDEBAR
// ======================================================

async function loadSidebar() {

    if (!sidebar) {
        return;
    }

    try {

        const response =
            await fetch("sidebar.html");

        if (!response.ok) {

            throw new Error(
                "sidebar.html tidak ditemukan."
            );

        }

        sidebar.innerHTML =
            await response.text();

        setupLogout();

    } catch (error) {

        console.error(
            "Sidebar error:",
            error
        );

    }

}


// ======================================================
// LOGOUT
// ======================================================

function setupLogout() {

    const button =
        document.getElementById(
            "logoutButton"
        );

    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        async () => {

            try {

                // ==========================================
                // LOGOUT SUPABASE
                // ==========================================

                await supabase.auth.signOut();


                // ==========================================
                // HAPUS GUEST
                // ==========================================

                sessionStorage.removeItem(
                    "guestMode"
                );


                // ==========================================
                // HAPUS SESSION GOOGLE LAMA
                // ==========================================

                localStorage.removeItem(
                    "googleSession"
                );

                localStorage.removeItem(
                    "googleToken"
                );


                // ==========================================
                // KEMBALI KE LOGIN
                // ==========================================

                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                // ==========================================
                // TETAP BERSIHKAN SESSION
                // ==========================================

                sessionStorage.removeItem(
                    "guestMode"
                );

                localStorage.removeItem(
                    "googleSession"
                );

                localStorage.removeItem(
                    "googleToken"
                );


                window.location.href =
                    "login.html";

            }

        }
    );

}


// ======================================================
// SHOW AVATAR LETTER
// ======================================================

function showAvatarLetter(name) {

    const miniAvatar =
        document.getElementById(
            "miniAvatar"
        );

    if (!miniAvatar) {
        return;
    }


    // Hapus mode foto

    miniAvatar.classList.remove(
        "has-image"
    );


    // Bersihkan isi sebelumnya

    miniAvatar.innerHTML = "";


    // Ambil huruf pertama

    miniAvatar.textContent =
        name
            .charAt(0)
            .toUpperCase();

}


// ======================================================
// SHOW AVATAR IMAGE
// ======================================================

function showAvatarImage(
    url,
    name
) {

    const miniAvatar =
        document.getElementById(
            "miniAvatar"
        );

    if (
        !miniAvatar ||
        !url
    ) {
        return;
    }


    // Aktifkan mode gambar

    miniAvatar.classList.add(
        "has-image"
    );


    // Bersihkan isi sebelumnya

    miniAvatar.innerHTML = "";


    const image =
        document.createElement(
            "img"
        );


    // Cache busting
    // supaya foto terbaru langsung terlihat

    image.src =
        url +
        "?t=" +
        Date.now();


    image.alt =
        "Foto profil";


    image.loading =
        "lazy";


    // Kalau foto gagal dimuat,
    // kembali ke huruf nama

    image.onerror = () => {

        console.error(
            "Avatar dashboard gagal dimuat:",
            url
        );


        showAvatarLetter(
            name
        );

    };


    miniAvatar.appendChild(
        image
    );

}


// ======================================================
// GET AVATAR URL
// ======================================================

function getAvatarUrl(userId) {

    /*
        Struktur Storage:

        avatars/
        └── USER_ID/
            └── avatar.webp
    */

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


    if (
        !data ||
        !data.publicUrl
    ) {

        return null;

    }


    return data.publicUrl;

}


// ======================================================
// SET USER UI
// ======================================================

function setUserUI(
    name,
    avatarUrl = null
) {

    const heroName =
        document.getElementById(
            "heroName"
        );


    const miniName =
        document.getElementById(
            "miniName"
        );


    if (heroName) {

        heroName.textContent =
            name;

    }


    if (miniName) {

        miniName.textContent =
            name;

    }


    // ==============================================
    // AVATAR
    // ==============================================

    if (avatarUrl) {

        showAvatarImage(
            avatarUrl,
            name
        );

    } else {

        showAvatarLetter(
            name
        );

    }

}


// ======================================================
// LOAD USER
// ======================================================

async function loadUser() {


    // ==================================================
    // 1. CEK GUEST
    // ==================================================

    const guest =
        sessionStorage.getItem(
            "guestMode"
        );


    if (guest === "true") {

        setUserUI(
            "Guest"
        );

        return;

    }


    // ==================================================
    // 2. CEK SUPABASE AUTH
    // ==================================================

    const {
        data: {
            user
        } = {},
        error
    } =
        await supabase.auth.getUser();


    if (error) {

        console.error(
            "Supabase user error:",
            error
        );

    }


    // ==================================================
    // TIDAK ADA USER
    // ==================================================

    if (!user) {

        window.location.href =
            "login.html";

        return;

    }


    // ==================================================
    // 3. AMBIL PROFILE
    // ==================================================

    const {
        data: profile,
        error: profileError
    } =
        await supabase
            .from("profiles")
            .select(
                "full_name, username, avatar_url"
            )
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


    if (profileError) {

        console.error(
            "Profile error:",
            profileError
        );

    }


    // ==================================================
    // 4. NAMA USER
    // ==================================================

    const name =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email
            ?.split("@")[0] ||
        "User";


    // ==================================================
    // 5. AMBIL AVATAR
    // ==================================================

    let avatarUrl =
        profile?.avatar_url;


    /*
        Kalau profiles.avatar_url kosong,
        kita tetap mencoba mencari:

        avatars/USER_ID/avatar.webp
    */

    if (!avatarUrl) {

        avatarUrl =
            getAvatarUrl(
                user.id
            );

    }


    // ==================================================
    // 6. TAMPILKAN KE DASHBOARD
    // ==================================================

    setUserUI(
        name,
        avatarUrl
    );

}


// ======================================================
// START
// ======================================================

async function init() {

    await loadSidebar();

    await loadUser();

}


init();
