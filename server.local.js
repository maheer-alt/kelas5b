const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3215;

const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml"
};

const server = http.createServer(
    (req, res) => {

        let filePath =
            req.url === "/"
                ? path.join(
                    __dirname,
                    "index.html"
                )
                : path.join(
                    __dirname,
                    decodeURIComponent(
                        req.url
                    )
                );


        if (!fs.existsSync(filePath)) {

            res.writeHead(404);

            res.end("404 - File tidak ditemukan");

            return;
        }


        const ext =
            path.extname(filePath)
                .toLowerCase();


        const contentType =
            mimeTypes[ext] ||
            "application/octet-stream";


        res.writeHead(
            200,
            {
                "Content-Type":
                    contentType
            }
        );


        fs.createReadStream(
            filePath
        ).pipe(res);

    }
);


server.listen(
    PORT,
    () => {

        console.log("");
        console.log(
            "🚀 Kelas 5B berjalan!"
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

    }
);