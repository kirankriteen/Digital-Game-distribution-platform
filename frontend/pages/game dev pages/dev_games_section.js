const token = localStorage.getItem("accessToken");

if (!token) {
    alert("You must login first");
    window.location.href = "../login/signup_login.htm";
}

async function loadGames() {
    try {
        const response = await fetch("/dev/mygames", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            throw new Error("Unauthorized");
        }

        const data = await response.json();
        console.log("Games Data:", data);

        const grid = document.querySelector(".games-grid");
        grid.innerHTML = "";

        const games = data.mygames;

        // ✅ No games fallback
        if (!games || games.length === 0) {
            grid.innerHTML = `
                <p style="color: var(--text-dim);">
                    No games uploaded yet. Click "+ Upload New" to get started.
                </p>
            `;
            return;
        }

        // ✅ Render games
        games.forEach(game => {
            const card = document.createElement("div");
            card.classList.add("game-card");

            // fallback image
            const imageUrl = game.coverUrl 
                ? game.coverUrl 
                : "https://placehold.co/400x200/1e293b/white?text=No+Cover";

            // format date
            const releaseDate = new Date(game.release_date).toLocaleDateString();

            card.innerHTML = `
                <div class="poster-container">
                    <span class="status-tag status-live">Live</span>
                    <img src="${imageUrl}" class="game-poster">
                </div>

                <div class="card-content">
                    <h3>${game.title}</h3>
                    <p>
                        ${game.genre} • ₹${game.price.toLocaleString()}
                    </p>
                    <p style="font-size: 0.8rem; color: var(--text-dim);">
                        Released: ${releaseDate}
                    </p>

                    <div class="card-footer">
                        <button class="manage-btn" data-id="${game.game_id}">
                            Manage
                        </button>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });

        // ✅ Manage button
        document.querySelectorAll(".manage-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const gameId = e.target.getAttribute("data-id");
                window.location.href = `manage_game.htm?id=${gameId}`;
            });
        });

    } catch (error) {
        console.error("Games load failed:", error);

        const grid = document.querySelector(".games-grid");
        grid.innerHTML = `
            <p style="color: var(--text-dim);">
                Failed to load games.
            </p>
        `;
    }
}

// 🚀 Run
loadGames();