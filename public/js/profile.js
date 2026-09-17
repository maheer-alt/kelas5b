import { supabase } from "./supabase.js";

const sidebar =
    document.getElementById("sidebar");


async function loadSidebar() {

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

}


async function loadProfile() {

    const guest =
        sessionStorage.getItem(
            "guestMode"
        );


    if (guest === "true") {

        document.getElementById(
            "fullName"
        ).textContent = "Guest";

        document.getElementById(
            "username"
        ).textContent = "@guest";

        document.getElementById(
            "username2"
        ).textContent = "guest";

        document.getElementById(
            "bio"
        ).textContent =
            "Mode Guest — profil demo.";

        document.getElementById(
            "avatar"
        ).textContent = "G";

        return;
    }


    const {
        data: {
            user
        }
    } = await supabase.auth.getUser();


    if (!user) {

        window.location.href =
            "login.html";

        return;
    }


    const {
        data: profile,
        error
    } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();


    if (error) {

        console.error(error);

        return;
    }


    const name =
        profile?.full_name ||
        user.email.split("@")[0];

    const username =
        profile?.username ||
        "user";


    document.getElementById(
        "fullName"
    ).textContent = name;


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


    document.getElementById(
        "avatar"
    ).textContent =
        name.charAt(0).toUpperCase();

}


loadSidebar();

loadProfile();