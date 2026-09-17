const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID
);

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY
);

function createUsername(name) {
    const cleanName = String(name || "user")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 15);

    return (
        cleanName +
        Math.floor(100 + Math.random() * 900)
    );
}

module.exports = async function handler(req, res) {

    // =========================================
    // CORS
    // =========================================

    res.setHeader(
        "Access-Control-Allow-Origin",
        "https://kelas-5b.netlify.app"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "POST, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
        return res.status(204).end();
    }

    // =========================================
    // ONLY POST
    // =========================================

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diperbolehkan."
        });
    }

    try {

        // =========================================
        // 1. AMBIL ID TOKEN
        // =========================================

        const {
            id_token
        } = req.body || {};

        if (!id_token) {
            return res.status(400).json({
                success: false,
                message: "ID Token tidak ditemukan."
            });
        }

        // =========================================
        // 2. VERIFY GOOGLE TOKEN
        // =========================================

        const ticket =
            await googleClient.verifyIdToken({
                idToken: id_token,
                audience:
                    process.env.GOOGLE_CLIENT_ID
            });

        const payload =
            ticket.getPayload();

        if (!payload) {
            return res.status(401).json({
                success: false,
                message: "Token Google tidak valid."
            });
        }

        // =========================================
        // 3. DATA GOOGLE
        // =========================================

        const googleId = payload.sub;

        const email =
            payload.email;

        const fullName =
            payload.name ||
            email?.split("@")[0] ||
            "User";

        const avatarUrl =
            payload.picture || "";

        if (!email) {
            return res.status(400).json({
                success: false,
                message:
                    "Google tidak memberikan email."
            });
        }

        console.log(
            "GOOGLE LOGIN:",
            email
        );

        // =========================================
        // 4. CARI USER SUPABASE
        // =========================================

        const {
            data: existingUsers,
            error: userSearchError
        } =
            await supabaseAdmin
                .auth
                .admin
                .listUsers({
                    page: 1,
                    perPage: 1000
                });

        if (userSearchError) {

            console.error(
                userSearchError
            );

            return res.status(500).json({
                success: false,
                message:
                    "Gagal mencari user Supabase."
            });
        }

        let user =
            existingUsers.users.find(
                currentUser =>
                    currentUser.email
                        ?.toLowerCase() ===
                    email.toLowerCase()
            );

        // =========================================
        // 5. BUAT USER SUPABASE
        // =========================================

        if (!user) {

            const {
                data: createdUser,
                error: createError
            } =
                await supabaseAdmin
                    .auth
                    .admin
                    .createUser({
                        email: email,

                        email_confirm: true,

                        user_metadata: {
                            full_name:
                                fullName,

                            avatar_url:
                                avatarUrl,

                            google_id:
                                googleId
                        }
                    });

            if (createError) {

                console.error(
                    createError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Gagal membuat akun Supabase."
                });
            }

            user =
                createdUser.user;
        }

        // =========================================
        // 6. PROFILE
        // =========================================

        const {
            data: profile,
            error: profileSearchError
        } =
            await supabaseAdmin
                .from("profiles")
                .select("id")
                .eq("id", user.id)
                .maybeSingle();

        if (profileSearchError) {

            console.error(
                profileSearchError
            );
        }

        // =========================================
        // 7. BUAT PROFILE
        // =========================================

        if (!profile) {

            const username =
                createUsername(
                    fullName
                );

            const {
                error: profileError
            } =
                await supabaseAdmin
                    .from("profiles")
                    .insert({
                        id: user.id,

                        username:
                            username,

                        full_name:
                            fullName,

                        bio: "",

                        avatar_url:
                            avatarUrl
                    });

            if (profileError) {

                console.error(
                    "PROFILE ERROR:",
                    profileError
                );
            }
        }

        // =========================================
        // 8. GENERATE JWT
        // MENIRU GO BACKEND
        // =========================================

        const token =
            jwt.sign(
                {
                    user_id:
                        user.id,

                    first_name:
                        fullName
                            .split(" ")[0],

                    email:
                        user.email,

                    provider:
                        "google"
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:
                        "7d"
                }
            );

        // =========================================
        // 9. RESPONSE
        // MIRIP FLUTTER + GO
        // =========================================

        return res.status(200).json({

            message:
                "google login success",

            token: token,

            user: {

                id:
                    user.id,

                first_name:
                    fullName
                        .split(" ")[0],

                last_name:
                    fullName
                        .split(" ")
                        .slice(1)
                        .join(" "),

                email:
                    user.email,

                avatar:
                    avatarUrl,

                provider:
                    "google"
            }
        });

    } catch (error) {

        console.error(
            "GOOGLE LOGIN ERROR:",
            error
        );

        return res.status(401).json({

            message:
                "invalid google token"
        });
    }
};
