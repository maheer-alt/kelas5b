const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// TEST API
app.get("/api/test.js", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Vercel Function hidup!"
    });
});

// GOOGLE LOGIN
app.post("/api/google-login.js", async (req, res) => {
    try {
        const googleLogin =
            require("./api/google-login.js");

        return await googleLogin(req, res);

    } catch (error) {
        console.error(
            "Google Login Route Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Google login server error."
        });
    }
});

const PORT = process.env.PORT || 3215;

app.listen(PORT, () => {
    console.log(`Server aktif di port ${PORT}`);
});