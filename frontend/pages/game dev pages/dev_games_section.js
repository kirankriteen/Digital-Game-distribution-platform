const token = localStorage.getItem("accessToken");

if (!token) {
    alert("You must login first");
    window.location.href = "../login/signup_login.htm";
}

async function loadGames() {
    try {
        const response = await fetch("http://localhost:3000/dev/mygames", {
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

        // ✅ No games fallback
        if (!data.games || data.games.length === 0) {
            grid.innerHTML = `
                <p style="color: var(--text-dim);">
                    No games uploaded yet. Click "+ Upload New" to get started.
                </p>
            `;
            return;
        }

        // ✅ Render each game
        data.games.forEach(game => {
            const card = document.createElement("div");
            card.classList.add("game-card");

            card.innerHTML = `
                <div class="poster-container">
                    <span class="status-tag ${game.status === "Live" ? "status-live" : "status-pending"}">
                        ${game.status || "Pending"}
                    </span>
                    <img src="${game.thumbnail || "https://placehold.co/400x200/1e293b/white?text=No+Image"}" 
                         class="game-poster">
                </div>
                <div class="card-content">
                    <h3>${game.title || "Untitled Game"}</h3>
                    <p>${game.genre || "Unknown"} • ${game.downloads || 0} Downloads</p>
                    <div class="card-footer">
                        <button class="manage-btn" data-id="${game.id}">
                            Manage
                        </button>
                    </div>
                </div>
            `;

            grid.appendChild(card);
        });

        // ✅ Manage button click
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