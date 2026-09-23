const container =
    document.getElementById(
        "emojiContainer"
    );


const categories = {

    "WAJAH & EMOSI": [
        "😀","😃","😄","😁","😆",
        "😅","😂","🤣","😊","😇",
        "🙂","🙃","😉","😌","😍",
        "🥰","😘","😗","😙","😚",
        "😋","😛","😝","😜","🤪",
        "🤨","🧐","🤓","😎","🥸",
        "🤩","🥳","😏","😒","😞",
        "😔","😟","😕","🙁","☹️",
        "😣","😖","😫","😩","🥺",
        "😢","😭","😤","😠","😡",
        "🤬","🤯","😳","🥵","🥶",
        "😱","😨","😰","😥","😓",
        "🤗","🤔","🫡","🤭","🤫",
        "🤥","😶","😐","😑","😬",
        "🙄","😯","😦","😧","😮",
        "😲","🥱","😴","🤤","😪",
        "😵","🤐","🥴","🤢","🤮",
        "🤧","😷","🤒","🤕","🤑"
    ],


    "KUCING": [
        "😺","😸","😹","😻","😼",
        "😽","🙀","😿","😾",
        "🐱","🐈","🐈‍⬛",
        "😹","😻","🙀","😿"
    ],


    "TANGAN & ORANG": [
        "👍","👎","👌","✌️","🤞",
        "🤟","🤘","🤙","👈","👉",
        "👆","👇","☝️","✋","🤚",
        "🖐️","🖖","👏","🙌","👐",
        "🤲","🤝","🙏","💪","👀",
        "🫶","❤️‍🔥","🫰"
    ],


    "HATI": [
        "❤️","🧡","💛","💚","💙",
        "💜","🖤","🩶","🤍","🤎",
        "🩷","🩵","❤️‍🔥","💔",
        "❣️","💕","💞","💓","💗",
        "💖","💘","💝","💟","♥️"
    ],


    "MEME & RANDOM": [
        "🗿","💀","☠️","🤡","👽",
        "👾","🤖","🎃","👻","👹",
        "👺","😈","👿","🤠","🥸",
        "🔥","💯","✨","⭐","🌟",
        "💫","⚡","💥","❄️","🌈",
        "🚀","🎉","🎊","💎","👑",
        "🍿","🗿","💀","🗿","🗿"
    ],


    "HEWAN": [
        "🐶","🐱","🐭","🐹","🐰",
        "🦊","🐻","🐼","🐨","🐯",
        "🦁","🐮","🐷","🐸","🐵",
        "🙈","🙉","🙊","🐔","🐧",
        "🐦","🐤","🦆","🦅","🦉",
        "🐺","🐗","🐴","🦄","🐝",
        "🐛","🦋","🐌","🐞","🐜",
        "🕷️","🐢","🐍","🦎","🦂",
        "🐙","🦑","🦀","🐠","🐟",
        "🐬","🐳","🦈"
    ],


    "MAKANAN": [
        "🍎","🍊","🍋","🍌","🍉",
        "🍇","🍓","🫐","🍒","🍑",
        "🥭","🍍","🥥","🥝","🍅",
        "🥑","🍆","🥕","🌽","🌶️",
        "🍔","🍟","🍕","🌭","🥪",
        "🌮","🌯","🍿","🍩","🍪",
        "🎂","🍰","🧁","🍫","🍭",
        "🍬","🍺","🥤","🧋","☕"
    ],


    "SIMBOL": [
        "✅","❌","❗","❓","‼️",
        "⁉️","⚠️","⭕","🚫","💯",
        "🔴","🟠","🟡","🟢","🔵",
        "🟣","⚫","⚪","🟤",
        "⭐","🌟","✨","💫","🔥",
        "⚡","💥","🎯","✔️","☑️"
    ]

};


/* =====================================================
   RENDER
===================================================== */

for (
    const [category, emojis]
    of Object.entries(categories)
) {

    const section =
        document.createElement(
            "section"
        );

    section.className =
        "emoji-category";


    const title =
        document.createElement(
            "div"
        );

    title.className =
        "category-title";

    title.textContent =
        category;


    const grid =
        document.createElement(
            "div"
        );

    grid.className =
        "emoji-grid";


    emojis.forEach(
        emoji => {

            const button =
                document.createElement(
                    "button"
                );

            button.className =
                "emoji";

            button.type =
                "button";

            button.textContent =
                emoji;

            button.title =
                `Pakai ${emoji}`;


            button.addEventListener(
                "click",
                () => {

                    localStorage.setItem(
                        "selectedEmoji",
                        emoji
                    );

                    window.location.href =
                        "chat.html";

                }
            );


            grid.appendChild(
                button
            );

        }
    );


    section.appendChild(
        title
    );

    section.appendChild(
        grid
    );

    container.appendChild(
        section
    );
}
