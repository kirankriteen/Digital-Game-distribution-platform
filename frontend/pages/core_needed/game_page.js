// --- Get game_id from URL ---
const params = new URLSearchParams(window.location.search);
const gameId = params.get("game_id");

const carousel = document.getElementById('mediaCarousel');
const buyBtn = document.getElementById('buyBtn');
const wishBtn = document.getElementById('wishBtn');

async function loadGame() {
    try {
        // Fetch game data from backend
        const res = await fetch(`http://localhost:3000/my/game?game_id=${gameId}`);
        const data = await res.json();
        console.log(data);
        const game = data.mygames[0];

        if (!game) {
            document.body.innerHTML = "<h1>Game Not Found</h1>";
            return;
        }

        // --- Populate main info ---
        document.querySelector(".game-title").innerText = game.title;
        document.querySelector(".price-tag").innerText = `$${game.price}`;
        document.querySelector(".description").innerText = game.bio;

        // --- Populate meta info ---
        const metaItems = document.querySelectorAll(".meta-list li strong");
        metaItems[0].innerText = data.fullname || "Unknown"; // Developer
        metaItems[1].innerText = data.studio_name || "Unknown";       // Publisher / Genre
        metaItems[2].innerText = game.release_date || "Unknown"; // Release Date
        metaItems[3].innerText = "Windows";                     // Platform

        // --- Populate system requirements ---
        const specs = document.querySelectorAll(".spec-item");
        specs[0].innerHTML = `<label>OS</label>${game.os}`;
        specs[1].innerHTML = `<label>Processor</label>${game.processor}`;
        specs[2].innerHTML = `<label>Memory</label>${game.memory}`;
        specs[3].innerHTML = `<label>Storage</label>${game.storage}`;

        // --- Update cover image ---
        if (game.coverUrl) {
            document.querySelector(".game-logo-box").src = game.coverUrl;
        }

        // --- Build media carousel ---
        carousel.innerHTML = "";

        if (game.videoUrl) {
            const video = document.createElement("video");
            video.controls = true;
            video.muted = true;
            video.loop = true;

            const source = document.createElement("source");
            source.src = game.videoUrl;
            source.type = "video/mp4";

            video.appendChild(source);
            carousel.appendChild(video);
        }

        const images = [game.img1Url, game.img2Url, game.img3Url];

        images.forEach(imgUrl => {
            if (imgUrl) {
                const img = document.createElement("img");
                img.src = imgUrl;
                carousel.appendChild(img);
            }
        });

    } catch (err) {
        console.error(err);
        document.body.innerHTML = "<h1>Error loading game</h1>";
    }
}

// Load the game when page opens
loadGame();