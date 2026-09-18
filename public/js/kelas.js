import { supabase } from "./supabase.js";

// ======================================================
// ELEMENT
// ======================================================

const sidebar =
document.getElementById("sidebar");

const addPostButton =
document.getElementById("addPostButton");

const closeComposer =
document.getElementById("closeComposer");

const postComposer =
document.getElementById("postComposer");

const imageInput =
document.getElementById("imageInput");

const postContent =
document.getElementById("postContent");

const fileName =
document.getElementById("fileName");

const imagePreview =
document.getElementById("imagePreview");

const previewImage =
document.getElementById("previewImage");

const publishButton =
document.getElementById("publishButton");

const feed =
document.getElementById("feed");

const emptyState =
document.getElementById("emptyState");

const refreshButton =
document.getElementById("refreshButton");

const notification =
document.getElementById("notification");

// ======================================================
// STATE
// ======================================================

let currentUser = null;

let selectedFile = null;

let notificationTimer = null;

// ======================================================
// NOTIFICATION
// ======================================================

function showNotification(
message,
isError = false
) {

if (!notification) {
    return;
}

notification.textContent =
    message;

notification.classList.toggle(
    "error",
    isError
);

notification.classList.add(
    "show"
);

clearTimeout(
    notificationTimer
);

notificationTimer =
    setTimeout(() => {

        notification.classList.remove(
            "show"
        );

    }, 3000);

}

// ======================================================
// LOAD SIDEBAR
// ======================================================

async function loadSidebar() {

if (!sidebar) {
    console.warn(
        "Element #sidebar tidak ditemukan."
    );

    return;
}

try {

    const response =
        await fetch("sidebar.html");

    if (!response.ok) {

        throw new Error(
            "Sidebar gagal dimuat."
        );

    }

    sidebar.innerHTML =
        await response.text();

    setupSidebar();

} catch (error) {

    console.error(
        "Sidebar:",
        error
    );

}

}

// ======================================================
// SIDEBAR
// ======================================================

function setupSidebar() {

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// ==================================================
// LOGOUT
// ==================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            logoutButton.disabled =
                true;

            try {

                await supabase.auth.signOut();

            } catch (error) {

                console.error(
                    "Logout:",
                    error
                );

            }

            sessionStorage.removeItem(
                "guestMode"
            );

            window.location.href =
                "login.html";

        }
    );

}


// ==================================================
// ACTIVE NAVIGATION
// ==================================================

const links =
    document.querySelectorAll(
        ".sidebar nav a"
    );

links.forEach(
    (link) => {

        const href =
            link.getAttribute(
                "href"
            );

        if (
            href ===
            "kelas.html"
        ) {

            link.classList.add(
                "active"
            );

        } else {

            link.classList.remove(
                "active"
            );

        }

    }
);

}

// ======================================================
// AUTH
// ======================================================

async function checkAuth() {

const {
    data,
    error
} =
    await supabase.auth.getUser();


if (error) {

    console.error(
        "Auth:",
        error
    );

}


if (data?.user) {

    currentUser =
        data.user;

    return true;

}


// ==================================================
// GUEST
// ==================================================

const guestMode =
    sessionStorage.getItem(
        "guestMode"
    );


if (
    guestMode ===
    "true"
) {

    currentUser =
        null;

    return false;

}


// ==================================================
// TIDAK LOGIN
// ==================================================

window.location.href =
    "login.html";

return false;

}

// ======================================================
// OPEN COMPOSER
// ======================================================

if (addPostButton) {

addPostButton.addEventListener(
    "click",
    () => {

        if (!currentUser) {

            showNotification(
                "Login diperlukan untuk membuat postingan.",
                true
            );

            return;

        }


        if (!postComposer) {
            return;
        }


        postComposer.classList.remove(
            "hidden"
        );


        postContent?.focus();


        window.scrollTo({

            top:
                postComposer.offsetTop - 30,

            behavior:
                "smooth"

        });

    }
);

}

// ======================================================
// CLOSE COMPOSER
// ======================================================

if (closeComposer) {

closeComposer.addEventListener(
    "click",
    () => {

        if (postComposer) {

            postComposer.classList.add(
                "hidden"
            );

        }

        resetComposer();

    }
);

}

// ======================================================
// IMAGE SELECT
// ======================================================

if (imageInput) {

imageInput.addEventListener(
    "change",
    (event) => {

        const file =
            event.target.files?.[0];


        if (!file) {
            return;
        }


        // ==========================================
        // FORMAT WEBP
        // ==========================================

        const fileNameLower =
            file.name.toLowerCase();


        const isWebP =
            file.type === "image/webp" &&
            fileNameLower.endsWith(
                ".webp"
            );


        if (!isWebP) {

            resetSelectedImage();


            showNotification(
                "Hanya untuk gambar berformat WEBP",
                true
            );

            return;

        }


        // ==========================================
        // MAXIMUM 1 MB
        // ==========================================

        const maxSize =
            1 * 1024 * 1024;


        if (
            file.size >
            maxSize
        ) {

            resetSelectedImage();


            showNotification(
                "Ukuran gambar maksimal 1 MB.",
                true
            );

            return;

        }


        // ==========================================
        // SIMPAN FILE
        // ==========================================

        selectedFile =
            file;


        if (fileName) {

            fileName.textContent =
                file.name;

        }


        // ==========================================
        // PREVIEW
        // ==========================================

        const objectUrl =
            URL.createObjectURL(
                file
            );


        if (previewImage) {

            previewImage.src =
                objectUrl;

        }


        if (imagePreview) {

            imagePreview.classList.remove(
                "hidden"
            );

        }

    }
);


}

// ======================================================
// RESET SELECTED IMAGE
// ======================================================

function resetSelectedImage() {

selectedFile =
    null;


if (imageInput) {

    imageInput.value =
        "";

}


if (fileName) {

    fileName.textContent =
        "Belum ada gambar";

}


if (imagePreview) {

    imagePreview.classList.add(
        "hidden"
    );

}


if (previewImage) {

    previewImage.src =
        "";

}

}

// ======================================================
// PUBLISH BUTTON
// ======================================================

if (publishButton) {

publishButton.addEventListener(
    "click",
    publishPost
);

}

// ======================================================
// PUBLISH POST
// ======================================================

async function publishPost() {

if (!currentUser) {

    showNotification(
        "Login diperlukan untuk membuat postingan.",
        true
    );

    return;

}


const content =
    postContent?.value.trim() ||
    "";


// ==================================================
// CEK ISI
// ==================================================

if (
    !content &&
    !selectedFile
) {

    showNotification(
        "Tulis sesuatu atau pilih gambar terlebih dahulu.",
        true
    );

    return;

}


// ==================================================
// CEK WEBP ULANG
// ==================================================

if (selectedFile) {

    const validWebP =
        selectedFile.type ===
            "image/webp" &&
        selectedFile.name
            .toLowerCase()
            .endsWith(".webp");


    if (!validWebP) {

        showNotification(
            "Hanya untuk gambar berformat WEBP",
            true
        );

        return;

    }


    // ==============================================
    // CEK UKURAN ULANG
    // ==============================================

    const maxSize =
        1 * 1024 * 1024;


    if (
        selectedFile.size >
        maxSize
    ) {

        showNotification(
            "Ukuran gambar maksimal 1 MB.",
            true
        );

        return;

    }

}


// ==================================================
// BUTTON LOADING
// ==================================================

publishButton.disabled =
    true;


publishButton.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...';


try {

    let imageUrl =
        null;


    // ==================================================
    // UPLOAD IMAGE
    // ==================================================

    if (selectedFile) {

        const filePath =
            `${currentUser.id}/${crypto.randomUUID()}.webp`;


        const {
            error: uploadError
        } =
            await supabase.storage
                .from("avatars")
                .upload(
                    filePath,
                    selectedFile,
                    {
                        contentType:
                            "image/webp",

                        upsert:
                            false
                    }
                );


        if (uploadError) {

            throw uploadError;

        }


        // ==============================================
        // PUBLIC URL
        // ==============================================

        const {
            data:
                publicData
        } =
            supabase.storage
                .from("avatars")
                .getPublicUrl(
                    filePath
                );


        imageUrl =
            publicData?.publicUrl ||
            null;

    }


    // ==================================================
    // INSERT POST
    // ==================================================

    const {
        error: postError
    } =
        await supabase
            .from("posts")
            .insert({

                user_id:
                    currentUser.id,

                content:
                    content,

                image_url:
                    imageUrl

            });


    if (postError) {

        throw postError;

    }


    // ==================================================
    // SUCCESS
    // ==================================================

    showNotification(
        "Postingan berhasil dibuat!"
    );


    resetComposer();


    if (postComposer) {

        postComposer.classList.add(
            "hidden"
        );

    }


    await loadPosts();

} catch (error) {

    console.error(
        "Publish post:",
        error
    );


    showNotification(
        error?.message ||
        "Gagal membuat postingan.",
        true
    );

} finally {

    publishButton.disabled =
        false;


    publishButton.innerHTML =
        '<i class="fa-solid fa-paper-plane"></i> Posting';

}

}

// ======================================================
// LOAD POSTS
// ======================================================

async function loadPosts() {

if (!feed) {
    return;
}


feed.innerHTML =
    `
    <div class="empty-state">
        Memuat postingan...
    </div>
    `;


const {
    data: posts,
    error
} =
    await supabase
        .from("posts")
        .select(`
            id,
            user_id,
            content,
            image_url,
            created_at,
            profiles (
                username,
                full_name,
                avatar_url
            )
        `)
        .order(
            "created_at",
            {
                ascending:
                    false
            }
        );


if (error) {

    console.error(
        "Load posts:",
        error
    );


    feed.innerHTML =
        "";


    if (emptyState) {

        emptyState.classList.add(
            "hidden"
        );

    }


    showNotification(
        "Gagal memuat postingan.",
        true
    );

    return;

}


feed.innerHTML =
    "";


// ==================================================
// EMPTY
// ==================================================

if (
    !posts ||
    posts.length === 0
) {

    if (emptyState) {

        emptyState.classList.remove(
            "hidden"
        );

    }

    return;

}


if (emptyState) {

    emptyState.classList.add(
        "hidden"
    );

}


// ==================================================
// CREATE CARDS
// ==================================================

posts.forEach(
    (post) => {

        feed.appendChild(
            createPostCard(
                post
            )
        );

    }
);

}

// ======================================================
// CREATE POST CARD
// ======================================================

function createPostCard(
post
) {

const card =
    document.createElement(
        "article"
    );


card.className =
    "post-card";


// ==================================================
// PROFILE
// ==================================================

const profile =
    Array.isArray(
        post.profiles
    )
        ? post.profiles[0]
        : post.profiles;


const name =
    profile?.full_name ||
    profile?.username ||
    "User";


const username =
    profile?.username ||
    "user";


const avatar =
    profile?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111111&color=f4f3ed`;


// ==================================================
// DATE
// ==================================================

const date =
    new Date(
        post.created_at
    );


const formattedDate =
    date.toLocaleString(
        "id-ID",
        {
            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );


// ==================================================
// DELETE PERMISSION
// ==================================================

const canDelete =
    currentUser &&
    currentUser.id ===
        post.user_id;


// ==================================================
// CARD HTML
// ==================================================

card.innerHTML =
    `

    <div class="post-top">

        <div class="post-user">

            <img
                class="post-avatar"
                src="${escapeHtml(avatar)}"
                alt="${escapeHtml(name)}"
                loading="lazy"
            >

            <div>

                <div class="post-name">
                    ${escapeHtml(name)}
                </div>

                <div class="post-time">
                    @${escapeHtml(username)}
                    ·
                    ${formattedDate}
                </div>

            </div>

        </div>


        ${
            canDelete
                ? `
                <button
                    class="delete-post"
                    data-id="${post.id}"
                    type="button"
                    title="Hapus postingan"
                    aria-label="Hapus postingan"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>
                `
                : ""
        }

    </div>


    ${
        post.image_url
            ? `
            <div class="post-image">

                <img
                    src="${escapeHtml(post.image_url)}"
                    alt="Postingan Kelas 5B"
                    loading="lazy"
                >

            </div>
            `
            : ""
    }


    ${
        post.content
            ? `
            <div class="post-content">
                ${escapeHtml(post.content)}
            </div>
            `
            : ""
    }

    `;


// ==================================================
// DELETE BUTTON
// ==================================================

const deleteButton =
    card.querySelector(
        ".delete-post"
    );


if (deleteButton) {

    deleteButton.addEventListener(
        "click",
        async () => {

            await deletePost(
                post
            );

        }
    );

}


return card;

}

// ======================================================
// DELETE POST
// ======================================================

async function deletePost(
post
) {

if (!currentUser) {
    return;
}


if (
    currentUser.id !==
    post.user_id
) {

    showNotification(
        "Kamu hanya bisa menghapus postingan sendiri.",
        true
    );

    return;

}


const confirmed =
    confirm(
        "Hapus postingan ini?"
    );


if (!confirmed) {
    return;
}


const {
    error
} =
    await supabase
        .from("posts")
        .delete()
        .eq(
            "id",
            post.id
        )
        .eq(
            "user_id",
            currentUser.id
        );


if (error) {

    console.error(
        "Delete post:",
        error
    );


    showNotification(
        "Gagal menghapus postingan.",
        true
    );

    return;

}


showNotification(
    "Postingan dihapus."
);


await loadPosts();

}

// ======================================================
// RESET COMPOSER
// ======================================================

function resetComposer() {

selectedFile =
    null;


if (postContent) {

    postContent.value =
        "";

}


resetSelectedImage();

}

// ======================================================
// ESCAPE HTML
// ======================================================

function escapeHtml(
value
) {

return String(
    value ?? ""
)
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}

// ======================================================
// REFRESH
// ======================================================

if (refreshButton) {

refreshButton.addEventListener(
    "click",
    async () => {

        const icon =
            refreshButton.querySelector(
                "i"
            );


        icon?.classList.add(
            "fa-spin"
        );


        refreshButton.disabled =
            true;


        try {

            await loadPosts();

        } finally {

            icon?.classList.remove(
                "fa-spin"
            );

            refreshButton.disabled =
                false;

        }

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

let mouseX =
    0;

let mouseY =
    0;

let ringX =
    0;

let ringY =
    0;


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

}

// ======================================================
// START
// ======================================================

async function start() {

await loadSidebar();

const isLoggedIn =
    await checkAuth();


// ==================================================
// FEED TETAP BOLEH DILIHAT GUEST
// ==================================================

if (
    isLoggedIn ||
    sessionStorage.getItem(
        "guestMode"
    ) === "true"
) {

    await loadPosts();

}

}

start();
