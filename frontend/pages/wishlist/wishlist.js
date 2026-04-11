console.log("wishlist.js loaded");

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", async () => {
    try{
        await loadWishlist();
    } catch (err) {
        console.error("Init error:", err);
    }
});

// =========================
// WAIT FOR BASE GAMES
// =========================
function waitForGames() {
    return new Promise(resolve => {
        const check = () => {
            if (window.backendGames && backendGames.length >= 0) {
                resolve();
            } else {
                setTimeout(check, 100);
            }
        };
        check();
    });
}

// =========================
// LOAD WISHLIST
// =========================
async function loadWishlist() {
    const container = document.getElementById("wishlist-container");

    if (!container) {
        console.error("wishlist-container not found");
        return;
    }

    try {
        const res = await fetch(`/my/wishlist`, {
            headers: {
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            }
        });
        console.log(res)
        if (!res.ok) {
            throw new Error("Failed to fetch wishlist");
        }

        const data = await res.json();
        console.log("wishlist response:", data);

        container.innerHTML = "";

        if (!data.games || data.games.length === 0) {
            showEmpty();
            return;
        }

        const wishlistIds = data.games.map(item => item.game_id);

        const wishlistGames = backendGames.filter(game =>
            wishlistIds.includes(game.game_id)
        );

        if (wishlistGames.length === 0) {
            showEmpty();
            return;
        }

        wishlistGames.forEach(game => {
            container.appendChild(createCard(game));
        });

    } catch (err) {
        console.error("Wishlist load error:", err);
        container.innerHTML = `
            <div style="text-align:center; padding:3rem; color:#888;">
                Failed to load wishlist
            </div>
        `;
    }
}

// =========================
// CREATE CARD
// =========================
function createCard(game) {
    const card = document.createElement("div");
    card.className = "wish-card";

    card.innerHTML = `
        <div class="image-container">
            <img src="${game.coverUrl || 'https://via.placeholder.com/400'}" class="wish-img">
            <button class="remove-wish" title="Remove">×</button>
        </div>

        <div class="wish-content">
            <div class="game-title">${game.title}</div>

            <div class="price-tag">
                $${game.price || 0}
                ${game.discount ? `<span class="discount-label">-${game.discount}%</span>` : ""}
            </div>

            <div class="btn-group">
                <button class="add-cart-btn">Add to Cart</button>
            </div>
        </div>
    `;

    // REMOVE BUTTON
    card.querySelector(".remove-wish").onclick = () => removeWish(card, game.game_id);

    return card;
}

// =========================
// REMOVE FROM WISHLIST
// =========================
async function removeWish(card, game_id) {
    try {
        const res = await fetch(`/my/remove-wishlist`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("accessToken")
            },
            body: JSON.stringify({ game_id })
        });

        if (!res.ok) {
            throw new Error("Failed to remove");
        }

        // UI animation
        card.style.opacity = "0";
        card.style.transform = "scale(0.9)";
        card.style.transition = "0.3s";

        setTimeout(() => {
            card.remove();

            if (document.querySelectorAll(".wish-card").length === 0) {
                showEmpty();
            }
        }, 300);

    } catch (err) {
        console.error("Remove error:", err);
        alert("Failed to remove from wishlist");
    }
}

// =========================
// EMPTY STATE
// =========================
function showEmpty() {
    const container = document.getElementById("wishlist-container");

    container.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:5rem; color:#666;">
            <h2>Your wishlist is empty</h2>
            <p>❤️ Save games to see them here</p>
        </div>
    `;
}