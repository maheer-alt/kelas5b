import { supabase } from "./supabase.js";

const sidebar =
    document.getElementById("sidebar");

const messages =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const emojiButton =
    document.getElementById("emojiButton");

const refreshButton =
    document.getElementById("refreshButton");

const guestNotice =
    document.getElementById("guestNotice");

const chatComposer =
    document.getElementById("chatComposer");

const notification =
    document.getElementById("notification");

let currentUser = null;
let isGuest = false;
let notificationTimer = null;


/* =====================================================
   NOTIFICATION
===================================================== */

function showNotification(
    message,
    isError = false
) {
    if (!notification) return;

    notification.textContent = message;

    notification.classList.toggle(
        "error",
        isError
    );

    notification.classList.add("show");

    clearTimeout(notificationTimer);

    notificationTimer =
        setTimeout(() => {
            notification.classList.remove("show");
        }, 3000);
}


/* =====================================================
   SIDEBAR
===================================================== */

async function loadSidebar() {

    if (!sidebar) return;

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

        sidebar
            .querySelector(
                'a[href="chat.html"]'
            )
            ?.classList.add("active");

        setupSidebar();

    } catch (error) {

        console.error(
            "Sidebar:",
            error
        );

    }
}


function setupSidebar() {

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );

    logoutButton?.addEventListener(
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


/* =====================================================
   AUTH
===================================================== */

async function checkAuth() {

    const {
        data,
        error
    } = await supabase.auth.getUser();

    if (error) {
        console.error(error);
    }

    if (data?.user) {

        currentUser =
            data.user;

        isGuest = false;

        return true;
    }

    if (
        sessionStorage.getItem(
            "guestMode"
        ) === "true"
    ) {

        isGuest = true;

        currentUser = null;

        return false;
    }

    window.location.href =
        "login.html";

    return false;
}


function updateUI() {

    if (isGuest) {

        guestNotice?.classList.remove(
            "hidden"
        );

        chatComposer?.classList.add(
            "hidden"
        );

    } else {

        guestNotice?.classList.add(
            "hidden"
        );

        chatComposer?.classList.remove(
            "hidden"
        );
    }
}


/* =====================================================
   LOAD CHAT
===================================================== */

async function loadMessages(
    scroll = true
) {

    messages.innerHTML = `
        <div class="chat-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Memuat chat...
        </div>
    `;

    const {
        data,
        error
    } = await supabase
        .from("messages")
        .select(`
            id,
            user_id,
            content,
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
                ascending: true
            }
        );

    if (error) {

        console.error(error);

        messages.innerHTML = `
            <div class="chat-empty">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <span>Gagal memuat chat.</span>
            </div>
        `;

        return;
    }

    messages.innerHTML = "";

    if (!data?.length) {

        messages.innerHTML = `
            <div class="chat-empty">
                <i class="fa-regular fa-comments"></i>
                <span>Belum ada pesan.</span>
            </div>
        `;

        return;
    }

    data.forEach(message => {

        messages.appendChild(
            createMessage(message)
        );

    });

    if (scroll) {
        scrollBottom();
    }
}


/* =====================================================
   CHECK EMOJI ONLY
===================================================== */

function isEmojiOnly(text) {

    if (!text) return false;

    const cleaned =
        text
            .replace(/\s/g, "")
            .replace(/\u200D/g, "")
            .replace(/\uFE0F/g, "");

    if (!cleaned) return false;

    return [
        ...cleaned
    ].every(char => {

        return (
            /\p{Extended_Pictographic}/u.test(
                char
            ) ||
            /\p{Emoji_Presentation}/u.test(
                char
            )
        );

    });
}


/* =====================================================
   MESSAGE ELEMENT
===================================================== */

function createMessage(message) {

    const row =
        document.createElement("div");

    const own =
        currentUser &&
        currentUser.id ===
            message.user_id;

    const emojiOnly =
        isEmojiOnly(
            message.content
        );

    row.className =
        `message-row ${
            own ? "own" : ""
        } ${
            emojiOnly
                ? "emoji-only"
                : ""
        }`;

    const profile =
        Array.isArray(message.profiles)
            ? message.profiles[0]
            : message.profiles;

    const name =
        profile?.full_name ||
        profile?.username ||
        "User";

    const username =
        profile?.username ||
        "user";

    const avatar =
        profile?.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
            name
        )}&background=111111&color=f4f3ed`;

    const time =
        new Date(
            message.created_at
        ).toLocaleTimeString(
            "id-ID",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    row.innerHTML = `

        ${
            !own
                ? `
                    <img
                        class="message-avatar"
                        src="${escapeHtml(avatar)}"
                        alt="${escapeHtml(name)}"
                    >
                `
                : ""
        }

        <div class="message-bubble">

            ${
                emojiOnly
                    ? ""
                    : `
                        <div class="message-author">
                            ${
                                own
                                    ? "KAMU"
                                    : `@${escapeHtml(username)}`
                            }
                        </div>
                    `
            }

            <div class="message-text">
                ${escapeHtml(message.content)}
            </div>

            <div class="message-bottom">

                <span class="message-time">
                    ${time}
                </span>

                ${
                    own
                        ? `
                            <button
                                class="delete-message"
                                type="button"
                                title="Hapus"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        `
                        : ""
                }

            </div>

        </div>

        ${
            own
                ? `
                    <img
                        class="message-avatar"
                        src="${escapeHtml(avatar)}"
                        alt="${escapeHtml(name)}"
                    >
                `
                : ""
        }
    `;

    const deleteButton =
        row.querySelector(
            ".delete-message"
        );

    deleteButton?.addEventListener(
        "click",
        () => deleteMessage(message)
    );

    return row;
}


/* =====================================================
   SEND
===================================================== */

async function sendMessage() {

    if (!currentUser) {

        showNotification(
            "Login diperlukan untuk mengirim pesan.",
            true
        );

        return;
    }

    const content =
        messageInput.value.trim();

    if (!content) return;

    sendButton.disabled = true;

    try {

        const { error } =
            await supabase
                .from("messages")
                .insert({
                    user_id:
                        currentUser.id,

                    content
                });

        if (error) {
            throw error;
        }

        messageInput.value = "";

        autoResize();

    } catch (error) {

        console.error(error);

        showNotification(
            error.message ||
                "Gagal mengirim pesan.",
            true
        );

    } finally {

        sendButton.disabled = false;
    }
}


/* =====================================================
   DELETE
===================================================== */

async function deleteMessage(message) {

    if (!currentUser) return;

    if (
        currentUser.id !==
        message.user_id
    ) {
        return;
    }

    if (
        !confirm(
            "Hapus pesan ini?"
        )
    ) {
        return;
    }

    const {
        error
    } = await supabase
        .from("messages")
        .delete()
        .eq(
            "id",
            message.id
        )
        .eq(
            "user_id",
            currentUser.id
        );

    if (error) {

        showNotification(
            "Gagal menghapus pesan.",
            true
        );

        return;
    }

    showNotification(
        "Pesan dihapus."
    );
}


/* =====================================================
   REALTIME
===================================================== */

function setupRealtime() {

    supabase
        .channel("kelas5b-chat")
        .on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "messages"
            },
            async () => {

                await loadMessages(
                    true
                );

            }
        )
        .subscribe();
}


/* =====================================================
   EMOJI PAGE
===================================================== */

emojiButton?.addEventListener(
    "click",
    () => {

        sessionStorage.setItem(
            "chatEmojiReturn",
            "true"
        );

        window.location.href =
            "emot.html";
    }
);


/* =====================================================
   RECEIVE EMOJI
===================================================== */

function receiveEmoji() {

    const emoji =
        localStorage.getItem(
            "selectedEmoji"
        );

    if (!emoji) return;

    localStorage.removeItem(
        "selectedEmoji"
    );

    if (!messageInput) return;

    messageInput.value += emoji;

    messageInput.focus();

    autoResize();
}


/* =====================================================
   TEXTAREA
===================================================== */

function autoResize() {

    messageInput.style.height =
        "auto";

    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            130
        ) + "px";
}


messageInput?.addEventListener(
    "input",
    autoResize
);


messageInput?.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);


sendButton?.addEventListener(
    "click",
    sendMessage
);


/* =====================================================
   REFRESH
===================================================== */

refreshButton?.addEventListener(
    "click",
    async () => {

        refreshButton.disabled =
            true;

        await loadMessages();

        refreshButton.disabled =
            false;
    }
);


/* =====================================================
   HELPERS
===================================================== */

function scrollBottom() {

    requestAnimationFrame(() => {

        messages.scrollTop =
            messages.scrollHeight;

    });
}


function escapeHtml(value) {

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


/* =====================================================
   START
===================================================== */

async function start() {

    await loadSidebar();

    await checkAuth();

    updateUI();

    await loadMessages();

    setupRealtime();

    receiveEmoji();
}

start();