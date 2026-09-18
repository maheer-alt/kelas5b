import {
    supabase
} from "./supabase.js";

const sidebar =
    document.getElementById("sidebar");

const friendsGrid =
    document.getElementById("friendsGrid");

const friendsCount =
    document.getElementById("friendsCount");

const friendsMessage =
    document.getElementById("friendsMessage");

const searchInput =
    document.getElementById("searchInput");

let allFriends = [];

async function loadSidebar() {
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

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );

        if (logoutButton) {
            logoutButton.addEventListener(
                "click",
                async () => {
                    try {
                        await supabase.auth.signOut();
                    } catch (error) {
                        console.error(
                            "Logout error:",
                            error
                        );
                    }

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
            );
        }
    } catch (error) {
        console.error(
            "Sidebar error:",
            error
        );
    }
}

function getAvatarUrl(userId) {
    if (!userId) {
        return null;
    }

    const filePath =
        `${userId}/avatar.webp`;

    const {
        data
    } =
        supabase
            .storage
            .from("avatars")
            .getPublicUrl(filePath);

    if (
        !data ||
        !data.publicUrl
    ) {
        return null;
    }

    return data.publicUrl;
}

function getInitial(name) {
    if (!name) {
        return "?";
    }

    return name
        .trim()
        .charAt(0)
        .toUpperCase();
}

function escapeHTML(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(date) {
    if (!date) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(
        new Date(date)
    );
}

function renderFriends(
    friends = allFriends
) {
    friendsGrid.innerHTML = "";

    friendsCount.textContent =
        friends.length;

    if (friends.length === 0) {
        friendsGrid.innerHTML = `
            <div class="empty-state">
                <strong>
                    Teman tidak ditemukan.
                </strong>

                <p>
                    Coba cari dengan nama
                    atau username lain.
                </p>
            </div>
        `;

        return;
    }

    friends.forEach(
        (friend) => {
            const name =
                friend.full_name ||
                friend.username ||
                "User";

            const username =
                friend.username ||
                "user";

            const bio =
                friend.bio ||
                "Belum ada bio.";

            const avatarUrl =
                friend.avatar_url ||
                getAvatarUrl(friend.id);

            const avatarHTML =
                avatarUrl
                    ? `
                        <img
                            src="${escapeHTML(
                                avatarUrl
                            )}?t=${Date.now()}"
                            alt="Foto ${escapeHTML(
                                name
                            )}"
                            loading="lazy"
                        >
                    `
                    : escapeHTML(
                        getInitial(name)
                    );

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "friend-card";

            card.innerHTML = `
                <div class="friend-header">
                    <div class="friend-avatar">
                        ${avatarHTML}
                    </div>

                    <div class="friend-name-area">
                        <h3 class="friend-name">
                            ${escapeHTML(name)}
                        </h3>

                        <p class="friend-username">
                            @${escapeHTML(username)}
                        </p>
                    </div>
                </div>

                <p class="friend-bio">
                    ${escapeHTML(bio)}
                </p>

                <div class="friend-footer">
                    <span class="friend-status">
                        Bergabung
                        ${formatDate(
                            friend.created_at
                        )}
                    </span>

                    <span
                        class="friend-dot"
                        aria-hidden="true"
                    ></span>
                </div>
            `;

            friendsGrid.appendChild(
                card
            );
        }
    );
}

async function loadFriends() {
    friendsMessage.textContent =
        "Memuat teman...";

    const {
        data,
        error
    } =
        await supabase
            .from("profiles")
            .select(
                "id, username, full_name, bio, avatar_url, created_at"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {
        console.error(
            "Gagal mengambil profiles:",
            error
        );

        friendsMessage.textContent =
            "Gagal memuat daftar teman.";

        friendsGrid.innerHTML = `
            <div class="empty-state">
                <strong>
                    Terjadi kesalahan.
                </strong>

                <p>
                    Coba refresh halaman.
                </p>
            </div>
        `;

        return;
    }

    allFriends =
        data || [];

    friendsMessage.textContent =
        allFriends.length === 0
            ? "Belum ada user."
            : "";

    renderFriends(
        allFriends
    );
}

if (searchInput) {
    searchInput.addEventListener(
        "input",
        () => {
            const keyword =
                searchInput.value
                    .trim()
                    .toLowerCase();

            if (!keyword) {
                renderFriends(
                    allFriends
                );

                return;
            }

            const filtered =
                allFriends.filter(
                    (friend) => {
                        const name =
                            (
                                friend.full_name ||
                                ""
                            ).toLowerCase();

                        const username =
                            (
                                friend.username ||
                                ""
                            ).toLowerCase();

                        const bio =
                            (
                                friend.bio ||
                                ""
                            ).toLowerCase();

                        return (
                            name.includes(keyword) ||
                            username.includes(keyword) ||
                            bio.includes(keyword)
                        );
                    }
                );

            renderFriends(
                filtered
            );
        }
    );
}

async function init() {
    await loadSidebar();
    await loadFriends();
}

init();