import { supabase } from "./supabase.js";


// ======================================================
// GOOGLE CLIENT ID
// ======================================================

const GOOGLE_CLIENT_ID =
    "87730206128-6ceakvkipdtcsdpqn0u15p88g2fa52vs.apps.googleusercontent.com";


// ======================================================
// VERCEL BACKEND
// ======================================================
//
// Karena Vercel Function lokal kita terbukti hidup di:
//
// http://localhost:3000/api/google-login.js
//
// Saat production:
// /api/google-login.js
//
// ======================================================

const GOOGLE_BACKEND_URL =
    "/api/google-login.js";


// ======================================================
// ELEMENT
// ======================================================

const loginForm =
    document.getElementById("loginForm");

const registerForm =
    document.getElementById("registerForm");

const loginMessage =
    document.getElementById("loginMessage");

const loginButton =
    document.getElementById("loginButton");

const googleButton =
    document.getElementById("googleButton");

const guestButton =
    document.getElementById("guestButton");

const passwordToggle =
    document.getElementById("passwordToggle");

const passwordInput =
    document.getElementById("password");


// ======================================================
// EMAIL LOGIN
// ======================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const password =
                passwordInput.value;

            if (!email || !password) {
                return;
            }

            loginMessage.textContent =
                "Memeriksa akun...";

            loginButton.disabled =
                true;

            try {

                const {
                    data,
                    error
                } =
                    await supabase.auth
                        .signInWithPassword({
                            email,
                            password
                        });

                if (error) {
                    throw error;
                }

                if (!data.user) {
                    throw new Error(
                        "Akun tidak ditemukan."
                    );
                }

                localStorage.removeItem(
                    "googleSession"
                );

                sessionStorage.removeItem(
                    "guestMode"
                );

                loginMessage.textContent =
                    "Login berhasil!";

                setTimeout(() => {

                    window.location.href =
                        "dashboard.html";

                }, 500);

            } catch (error) {

                console.error(
                    "Email Login:",
                    error
                );

                loginMessage.textContent =
                    "Login gagal: " +
                    (
                        error.message ||
                        "Terjadi kesalahan."
                    );

                loginButton.disabled =
                    false;

            }

        }
    );

}


// ======================================================
// GOOGLE LOGIN
// ======================================================

if (googleButton) {

    googleButton.addEventListener(
        "click",
        async () => {

            try {

                googleButton.disabled =
                    true;

                loginMessage.textContent =
                    "Menghubungkan ke Google...";


                // ==================================================
                // CEK GOOGLE IDENTITY SERVICES
                // ==================================================

                if (
                    !window.google ||
                    !window.google.accounts ||
                    !window.google.accounts.id
                ) {

                    throw new Error(
                        "Google Identity Services belum siap. Tunggu beberapa detik lalu coba lagi."
                    );

                }


                // ==================================================
                // AMBIL GOOGLE ID TOKEN
                // ==================================================

                const idToken =
                    await getGoogleIdToken();


                if (!idToken) {

                    throw new Error(
                        "Google ID Token tidak ditemukan."
                    );

                }


                loginMessage.textContent =
                    "Mengirim ke server...";


                // ==================================================
                // KIRIM KE VERCEL FUNCTION
                // ==================================================
                //
                // Backend menerima:
                //
                // {
                //     id_token: "..."
                // }
                //
                // ==================================================

                const response =
                    await fetch(
                        GOOGLE_BACKEND_URL,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                id_token:
                                    idToken
                            })
                        }
                    );


                let result;

                try {

                    result =
                        await response.json();

                } catch {

                    throw new Error(
                        "Server memberikan response yang tidak valid."
                    );

                }


                // ==================================================
                // CEK RESPONSE
                // ==================================================

                if (!response.ok) {

                    throw new Error(
                        result.message ||
                        "Google Login gagal di server."
                    );

                }


                if (!result.user) {

                    throw new Error(
                        "Data user Google tidak ditemukan."
                    );

                }


                // ==================================================
                // SIMPAN GOOGLE SESSION
                // ==================================================

                localStorage.setItem(
                    "googleSession",
                    JSON.stringify(
                        result.user
                    )
                );


                // Kalau backend mengembalikan JWT,
                // simpan juga untuk kebutuhan aplikasi.

                if (result.token) {

                    localStorage.setItem(
                        "googleToken",
                        result.token
                    );

                }


                // Pastikan Guest tidak aktif.

                sessionStorage.removeItem(
                    "guestMode"
                );


                loginMessage.textContent =
                    "✓ Google Login berhasil!";


                // ==================================================
                // DASHBOARD
                // ==================================================

                setTimeout(() => {

                    window.location.href =
                        "dashboard.html";

                }, 600);


            } catch (error) {

                console.error(
                    "Google Login:",
                    error
                );

                loginMessage.textContent =
                    "Google Login gagal: " +
                    (
                        error.message ||
                        "Terjadi kesalahan."
                    );

                googleButton.disabled =
                    false;

            }

        }
    );

}


// ======================================================
// GOOGLE ID TOKEN
// ======================================================

function getGoogleIdToken() {

    return new Promise(
        (resolve, reject) => {

            let finished =
                false;


            function finish(
                token
            ) {

                if (finished) {
                    return;
                }

                finished =
                    true;

                resolve(token);

            }


            function fail(
                error
            ) {

                if (finished) {
                    return;
                }

                finished =
                    true;

                reject(error);

            }


            try {

                const client =
                    window.google.accounts.id;


                client.initialize({

                    client_id:
                        GOOGLE_CLIENT_ID,

                    callback:
                        (response) => {

                            if (
                                response &&
                                response.credential
                            ) {

                                finish(
                                    response.credential
                                );

                            } else {

                                fail(
                                    new Error(
                                        "Google tidak mengembalikan credential."
                                    )
                                );

                            }

                        },

                    auto_select:
                        false,

                    cancel_on_tap_outside:
                        true

                });


                client.prompt(
                    (notification) => {

                        if (
                            notification.isNotDisplayed()
                        ) {

                            fail(
                                new Error(
                                    "Google Login tidak dapat ditampilkan."
                                )
                            );

                        }


                        if (
                            notification.isSkippedMoment()
                        ) {

                            fail(
                                new Error(
                                    "Login Google dibatalkan."
                                )
                            );

                        }

                    }
                );


            } catch (error) {

                fail(error);

            }

        }
    );

}


// ======================================================
// ENSURE PROFILE
// ======================================================

async function ensureProfile(
    user
) {

    if (!user) {
        return;
    }


    const {
        data: existingProfile,
        error: selectError
    } =
        await supabase
            .from("profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();


    if (selectError) {

        console.error(
            "Profile check:",
            selectError
        );

        return;

    }


    if (existingProfile) {
        return;
    }


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
            fullName
        );


    const avatarUrl =
        metadata.avatar_url ||
        metadata.picture ||
        "";


    const {
        error
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

            });


    if (error) {

        console.error(
            "Profile create:",
            error
        );

    }

}


// ======================================================
// USERNAME
// ======================================================

function createUsername(
    name
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


    return (
        cleanName +
        Math.floor(
            100 +
            Math.random() * 900
        )
    );

}


// ======================================================
// GUEST
// ======================================================

if (guestButton) {

    guestButton.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "googleSession"
            );

            localStorage.removeItem(
                "googleToken"
            );

            sessionStorage.setItem(
                "guestMode",
                "true"
            );

            window.location.href =
                "dashboard.html";

        }
    );

}


// ======================================================
// REGISTER
// ======================================================

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const fullName =
                document
                    .getElementById("fullName")
                    .value
                    .trim();


            const username =
                document
                    .getElementById("username")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("password")
                    .value;


            const message =
                document.getElementById(
                    "registerMessage"
                );


            message.textContent =
                "Membuat akun...";


            try {

                const {
                    data,
                    error
                } =
                    await supabase.auth.signUp({

                        email,

                        password

                    });


                if (error) {
                    throw error;
                }


                if (!data.user) {

                    throw new Error(
                        "Akun belum berhasil dibuat."
                    );

                }


                if (data.session) {

                    const {
                        error: profileError
                    } =
                        await supabase
                            .from("profiles")
                            .insert({

                                id:
                                    data.user.id,

                                username:
                                    username,

                                full_name:
                                    fullName,

                                bio:
                                    "",

                                avatar_url:
                                    ""

                            });


                    if (profileError) {

                        console.error(
                            profileError
                        );

                    }


                    localStorage.removeItem(
                        "googleSession"
                    );

                    localStorage.removeItem(
                        "googleToken"
                    );


                    message.textContent =
                        "Akun berhasil dibuat!";


                    setTimeout(() => {

                        window.location.href =
                            "dashboard.html";

                    }, 700);


                    return;

                }


                message.textContent =
                    "Akun dibuat. Silakan cek email untuk verifikasi.";


            } catch (error) {

                console.error(
                    "Register:",
                    error
                );

                message.textContent =
                    "Gagal: " +
                    (
                        error.message ||
                        "Terjadi kesalahan."
                    );

            }

        }
    );

}


// ======================================================
// PASSWORD SHOW / HIDE
// ======================================================

if (
    passwordToggle &&
    passwordInput
) {

    passwordToggle.addEventListener(
        "click",
        () => {

            const isPassword =
                passwordInput.type ===
                "password";


            passwordInput.type =
                isPassword
                    ? "text"
                    : "password";


            passwordToggle.innerHTML =
                isPassword
                    ? '<i class="fa-solid fa-eye-slash"></i>'
                    : '<i class="fa-solid fa-eye"></i>';

        }
    );

}


// ======================================================
// CUSTOM CURSOR
// ======================================================

const dot =
    document.querySelector(
        ".cursor-dot"
    );

const ring =
    document.querySelector(
        ".cursor-ring"
    );


if (
    dot &&
    ring &&
    window.matchMedia(
        "(pointer: fine)"
    ).matches
) {

    let mouseX = 0;
    let mouseY = 0;

    let ringX = 0;
    let ringY = 0;


    document.addEventListener(
        "mousemove",
        (event) => {

            mouseX =
                event.clientX;

            mouseY =
                event.clientY;


            dot.style.left =
                mouseX + "px";

            dot.style.top =
                mouseY + "px";

        }
    );


    function animateCursor() {

        ringX +=
            (mouseX - ringX) *
            0.12;


        ringY +=
            (mouseY - ringY) *
            0.12;


        ring.style.left =
            ringX + "px";


        ring.style.top =
            ringY + "px";


        requestAnimationFrame(
            animateCursor
        );

    }


    animateCursor();


    const interactive =
        document.querySelectorAll(
            "button, a, input"
        );


    interactive.forEach(
        (element) => {

            element.addEventListener(
                "mouseenter",
                () => {

                    ring.style.width =
                        "44px";

                    ring.style.height =
                        "44px";

                }
            );


            element.addEventListener(
                "mouseleave",
                () => {

                    ring.style.width =
                        "30px";

                    ring.style.height =
                        "30px";

                }
            );

        }
    );

}
