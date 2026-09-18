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
// CREATE USERNAME
// ======================================================

function createUsername(
name,
userId
) {

const cleanName =
    String(name || "user")
        .toLowerCase()
        .replace(
            /[^a-z0-9]/g,
            ""
        )
        .slice(
            0,
            15
        );


// Gunakan bagian ID supaya username
// lebih stabil dan tidak berubah-ubah.

const idPart =
    String(userId || "")
        .replace(
            /-/g,
            ""
        )
        .slice(
            0,
            4
        );


return (
    cleanName ||
    "user"
) +
    idPart;

}

// ======================================================
// ENSURE PROFILE
// ======================================================

async function ensureProfile(
user
) {

if (!user) {
    return null;
}


// ==================================================
// CEK PROFILE
// ==================================================

const {
    data: existingProfile,
    error: checkError
} =
    await supabase
        .from("profiles")
        .select(
            "id, username, full_name, bio, avatar_url"
        )
        .eq(
            "id",
            user.id
        )
        .maybeSingle();


if (checkError) {

    console.error(
        "Profile check error:",
        checkError
    );

    throw checkError;

}


// ==================================================
// PROFILE SUDAH ADA
// ==================================================

if (existingProfile) {

    return existingProfile;

}


// ==================================================
// AMBIL DATA DARI AUTH
// ==================================================

const metadata =
    user.user_metadata || {};


const fullName =
    metadata.full_name ||
    metadata.name ||
    user.email
        ?.split("@")[0] ||
    "User";


const username =
    metadata.username ||
    createUsername(
        fullName,
        user.id
    );


const avatarUrl =
    metadata.avatar_url ||
    metadata.picture ||
    "";


// ==================================================
// BUAT PROFILE
// ==================================================

const {
    data: newProfile,
    error: insertError
} =
    await supabase
        .from("profiles")
        .insert({

            id:
                user.id,

            username:
                username,

            full_name:
                fullName,

            bio:
                "",

            avatar_url:
                avatarUrl

        })
        .select()
        .single();


if (insertError) {

    console.error(
        "Profile create error:",
        insertError
    );

    throw insertError;

}


console.log(
    "Profile otomatis dibuat:",
    newProfile
);


return newProfile;

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
// SIMPAN USER
// ==================================================

console.log(
    "User aktif:",
    user
);


// ==================================================
// 3. PASTIKAN PROFILE ADA
// ==================================================

let profile = null;


try {

    profile =
        await ensureProfile(
            user
        );

} catch (error) {

    console.error(
        "Ensure profile dashboard:",
        error
    );

    /*
        Kalau profile gagal dibuat,
        dashboard tetap bisa memakai
        data dari Auth.
    */

}


// ==================================================
// 4. NAMA USER
// ==================================================

const name =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
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
    kita tetap mencoba:

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
