import { supabase } from "./supabase.js";


// ======================================================
// GOOGLE CLIENT ID
// ======================================================

const GOOGLE_CLIENT_ID =
    "87730206128-6ceakvkipdtcsdpqn0u15p88g2fa52vs.apps.googleusercontent.com";


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
                passwordInput
                    ? passwordInput.value
                    : "";


            if (!email || !password) {
                return;
            }


            if (loginButton) {
                loginButton.disabled = true;
            }


            if (loginMessage) {
                loginMessage.textContent =
                    "Memeriksa akun...";
            }


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


                if (!data || !data.user) {

                    throw new Error(
                        "Akun tidak ditemukan."
                    );

                }


                // ==================================================
                // PASTIKAN PROFILE ADA
                // ==================================================

                await ensureProfile(
                    data.user
                );


                // ==================================================
                // BERSIHKAN MODE LAMA
                // ==================================================

                localStorage.removeItem(
                    "googleSession"
                );

                localStorage.removeItem(
                    "googleToken"
                );

                sessionStorage.removeItem(
                    "guestMode"
                );


                if (loginMessage) {
                    loginMessage.textContent =
                        "Login berhasil!";
                }


                setTimeout(
                    () => {

                        window.location.href =
                            "dashboard.html";

                    },
                    500
                );


            } catch (error) {

                console.error(
                    "Email Login:",
                    error
                );


                if (loginMessage) {

                    loginMessage.textContent =
                        "Login gagal: " +
                        (
                            error.message ||
                            "Terjadi kesalahan."
                        );

                }


                if (loginButton) {
                    loginButton.disabled =
                        false;
                }

            }

        }
    );

}


// ======================================================
// GOOGLE IDENTITY SERVICES
// ======================================================

let googleInitialized = false;

let googleReady = false;


// ======================================================
// INITIALIZE GOOGLE
// ======================================================

function initializeGoogle() {

    if (googleInitialized) {
        return true;
    }


    if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id
    ) {

        return false;

    }


    try {

        window.google.accounts.id.initialize({

            client_id:
                GOOGLE_CLIENT_ID,

            callback:
                handleGoogleCredential,

            auto_select:
                false,

            cancel_on_tap_outside:
                true,

            use_fedcm_for_button:
                true

        });


        googleInitialized =
            true;

        googleReady =
            true;


        console.log(
            "Google Identity Services siap."
        );


        return true;


    } catch (error) {

        console.error(
            "Google Initialize Error:",
            error
        );


        return false;

    }

}


// ======================================================
// GOOGLE CALLBACK
// ======================================================

async function handleGoogleCredential(
    response
) {

    if (
        !response ||
        !response.credential
    ) {

        console.error(
            "Google tidak memberikan credential."
        );


        if (loginMessage) {

            loginMessage.textContent =
                "Google tidak memberikan ID Token.";

        }


        return;

    }


    try {

        if (loginMessage) {

            loginMessage.textContent =
                "Menghubungkan ke Supabase...";

        }


        // ==================================================
        // GOOGLE → SUPABASE AUTH SESSION
        // ==================================================

        const {
            data,
            error
        } =
            await supabase.auth
                .signInWithIdToken({

                    provider:
                        "google",

                    token:
                        response.credential

                });


        if (error) {

            console.error(
                "Supabase Google Login:",
                error
            );

            throw error;

        }


        if (!data || !data.user) {

            throw new Error(
                "Supabase tidak mengembalikan user."
            );

        }


        // ==================================================
        // PASTIKAN PROFILE ADA
        // ==================================================

        await ensureProfile(
            data.user
        );


        // ==================================================
        // BERSIHKAN MODE LAMA
        // ==================================================

        localStorage.removeItem(
            "googleSession"
        );

        localStorage.removeItem(
            "googleToken"
        );

        sessionStorage.removeItem(
            "guestMode"
        );


        // ==================================================
        // BERHASIL
        // ==================================================

        console.log(
            "Google Login berhasil:",
            data.user
        );


        if (loginMessage) {

            loginMessage.textContent =
                "✓ Google Login berhasil!";

        }


        // ==================================================
        // DASHBOARD
        // ==================================================

        setTimeout(
            () => {

                window.location.href =
                    "dashboard.html";

            },
            600
        );


    } catch (error) {

        console.error(
            "Google Login:",
            error
        );


        if (loginMessage) {

            loginMessage.textContent =
                "Google Login gagal: " +
                (
                    error.message ||
                    "Terjadi kesalahan."
                );

        }


        restoreGoogleButton();

    }

}


// ======================================================
// RENDER GOOGLE BUTTON
// ======================================================

function renderGoogleButton() {

    if (!initializeGoogle()) {

        setTimeout(
            renderGoogleButton,
            300
        );

        return;

    }


    const oldButton =
        document.getElementById(
            "googleButton"
        );


    let container =
        document.getElementById(
            "googleButtonContainer"
        );


    if (!container) {

        container =
            document.createElement(
                "div"
            );


        container.id =
            "googleButtonContainer";


        container.className =
            "google-button-container";


        if (oldButton) {

            oldButton.parentNode.insertBefore(
                container,
                oldButton
            );


            oldButton.style.display =
                "none";

        } else {

            const loginCard =
                document.querySelector(
                    ".login-card"
                );


            if (loginCard) {

                loginCard.appendChild(
                    container
                );

            } else {

                document.body.appendChild(
                    container
                );

            }

        }

    }


    container.innerHTML =
        "";


    window.google.accounts.id.renderButton(

        container,

        {

            type:
                "standard",

            theme:
                "outline",

            size:
                "large",

            text:
                "signin_with",

            shape:
                "rectangular",

            logo_alignment:
                "left",

            width:
                320

        }

    );


    console.log(
        "Google Button berhasil dirender."
    );

}


// ======================================================
// RESTORE GOOGLE BUTTON
// ======================================================

function restoreGoogleButton() {

    if (googleButton) {

        googleButton.disabled =
            false;

    }

}


// ======================================================
// START GOOGLE
// ======================================================

function startGoogle() {

    if (googleReady) {

        renderGoogleButton();

        return;

    }


    renderGoogleButton();

}


// ======================================================
// TUNGGU GOOGLE IDENTITY SERVICES
// ======================================================

function waitForGoogle() {

    if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
    ) {

        startGoogle();

        return;

    }


    setTimeout(
        waitForGoogle,
        300
    );

}


// ======================================================
// MULAI SAAT HALAMAN SIAP
// ======================================================

window.addEventListener(
    "load",
    () => {

        waitForGoogle();

    }
);


// ======================================================
// ENSURE PROFILE
// ======================================================

async function ensureProfile(user) {

    if (!user) {
        return;
    }


    try {

        // ==================================================
        // CEK PROFILE
        // ==================================================

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
                "Profile check error:",
                selectError
            );

            throw selectError;

        }


        // ==================================================
        // PROFILE SUDAH ADA
        // ==================================================

        if (existingProfile) {

            console.log(
                "Profile sudah ada:",
                user.id
            );

            return;

        }


        // ==================================================
        // AMBIL METADATA USER
        // ==================================================

        const metadata =
            user.user_metadata || {};


        const fullName =
            metadata.full_name ||
            metadata.name ||
            user.email?.split("@")[0] ||
            "User";


        const username =
            metadata.username ||
            createUsername(fullName);


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
            "Profile berhasil dibuat:",
            newProfile
        );


    } catch (error) {

        console.error(
            "Ensure profile error:",
            error
        );

        throw error;

    }

}


// ======================================================
// CREATE USERNAME
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
// GUEST LOGIN
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
                    .getElementById(
                        "fullName"
                    )
                    .value
                    .trim();


            const username =
                document
                    .getElementById(
                        "username"
                    )
                    .value
                    .trim();


            const email =
                document
                    .getElementById(
                        "email"
                    )
                    .value
                    .trim();


            const password =
                document
                    .getElementById(
                        "password"
                    )
                    .value;


            const message =
                document.getElementById(
                    "registerMessage"
                );


            message.textContent =
                "Membuat akun...";


            try {

                // ==================================================
                // BUAT AKUN
                // ==================================================

                const {
                    data,
                    error
                } =
                    await supabase.auth
                        .signUp({

                            email:
                                email,

                            password:
                                password,

                            options: {

                                // Data ini akan masuk ke
                                // user_metadata.
                                // Berguna saat profile dibuat
                                // setelah email dikonfirmasi.

                                data: {

                                    full_name:
                                        fullName,

                                    username:
                                        username

                                },


                                // Setelah klik link verifikasi
                                // email → dashboard.

                                emailRedirectTo:
                                    `${window.location.origin}/dashboard.html`

                            }

                        });


                if (error) {
                    throw error;
                }


                if (!data || !data.user) {

                    throw new Error(
                        "Akun belum berhasil dibuat."
                    );

                }


                // ==================================================
                // JIKA LANGSUNG MENDAPAT SESSION
                // ==================================================

                if (data.session) {

                    await ensureProfile(
                        data.user
                    );


                    localStorage.removeItem(
                        "googleSession"
                    );

                    localStorage.removeItem(
                        "googleToken"
                    );

                    sessionStorage.removeItem(
                        "guestMode"
                    );


                    message.textContent =
                        "Akun berhasil dibuat!";


                    setTimeout(
                        () => {

                            window.location.href =
                                "dashboard.html";

                        },
                        700
                    );


                    return;

                }


                // ==================================================
                // JIKA EMAIL CONFIRMATION AKTIF
                // ==================================================

                message.textContent =
                    "Akun dibuat! Silakan cek email untuk verifikasi.";


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
            (
                mouseX -
                ringX
            ) * 0.12;


        ringY +=
            (
                mouseY -
                ringY
            ) * 0.12;


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