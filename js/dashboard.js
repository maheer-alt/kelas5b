import { supabase } from "./supabase.js";


// ======================================================
// ELEMENT
// ======================================================

const sidebar =
    document.getElementById("sidebar");


// ======================================================
// GOOGLE SESSION
// ======================================================

function getGoogleSession() {

    const session =
        localStorage.getItem(
            "googleSession"
        );

    if (!session) {
        return null;
    }

    try {

        return JSON.parse(session);

    } catch (error) {

        console.error(
            "Google session rusak:",
            error
        );

        localStorage.removeItem(
            "googleSession"
        );

        return null;
    }
}


// ======================================================
// SIDEBAR
// ======================================================

async function loadSidebar() {

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
                // HAPUS GOOGLE SESSION
                // ==========================================

                localStorage.removeItem(
                    "googleSession"
                );


                // ==========================================
                // KE LOGIN
                // ==========================================

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

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
            "Guest",
            "G"
        );

        return;
    }


    // ==================================================
    // 2. CEK GOOGLE SESSION
    // ==================================================

    const googleSession =
        getGoogleSession();


    if (googleSession) {

        const name =
            googleSession.name ||
            googleSession.email?.split("@")[0] ||
            "Google User";


        const avatar =
            name
                .charAt(0)
                .toUpperCase();


        setUserUI(
            name,
            avatar
        );


        return;
    }


    // ==================================================
    // 3. CEK SUPABASE SESSION
    // ==================================================

    const {
        data: {
            user
        },
        error
    } =
        await supabase.auth.getUser();


    if (error) {

        console.error(
            "Supabase user error:",
            error
        );

    }


    if (!user) {

        window.location.href =
            "login.html";

        return;
    }


    // ==================================================
    // 4. AMBIL PROFILE SUPABASE
    // ==================================================

    const {
        data: profile,
        error: profileError
    } =
        await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();


    if (profileError) {

        console.error(
            "Profile error:",
            profileError
        );

    }


    const name =
        profile?.full_name ||
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User";


    const avatar =
        name
            .charAt(0)
            .toUpperCase();


    setUserUI(
        name,
        avatar
    );

}


// ======================================================
// SET USER UI
// ======================================================

function setUserUI(
    name,
    avatar
) {

    const heroName =
        document.getElementById(
            "heroName"
        );

    const miniName =
        document.getElementById(
            "miniName"
        );

    const miniAvatar =
        document.getElementById(
            "miniAvatar"
        );


    if (heroName) {

        heroName.textContent =
            name;

    }


    if (miniName) {

        miniName.textContent =
            name;

    }


    if (miniAvatar) {

        miniAvatar.textContent =
            avatar;

    }

}


// ======================================================
// START
// ======================================================

async function init() {

    await loadSidebar();

    await loadUser();

}


init();