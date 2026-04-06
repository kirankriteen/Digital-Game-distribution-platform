// --- Get game_id from URL ---
const params = new URLSearchParams(window.location.search);
const gameId = params.get("game_id");

// --- Select DOM elements ---
const carousel = document.getElementById('mediaCarousel');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const buyBtn = document.getElementById('buyBtn');
const wishBtn = document.getElementById('wishBtn');

let scrollInterval;

async function loadGame() {
    try {
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

        // --- Meta info ---
        const metaItems = document.querySelectorAll(".meta-list li strong");
        metaItems[0].innerText = data.studio_name || "Unknown";
        metaItems[1].innerText = game.genre || "Unknown";
        metaItems[2].innerText = game.release_date || "Unknown";
        metaItems[3].innerText = "Windows";

        // --- System requirements ---
        const specs = document.querySelectorAll(".spec-item");
        specs[0].innerHTML = `<label>OS</label>${game.os}`;
        specs[1].innerHTML = `<label>Processor</label>${game.processor}`;
        specs[2].innerHTML = `<label>Memory</label>${game.memory}`;
        specs[3].innerHTML = `<label>Storage</label>${game.storage}`;

        // --- Cover image ---
        if (game.coverUrl) {
            document.querySelector(".game-logo-box").src = game.coverUrl;
        }

        // --- Carousel ---
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

        carousel.scrollLeft = 0;
        resetTimer();

        // 🔥 IMPORTANT: update button state after loading
        updateBuyButtonState();

    } catch (err) {
        console.error(err);
        document.body.innerHTML = "<h1>Error loading game</h1>";
    }
}

function updateBuyButtonState() {
    const cart = JSON.parse(sessionStorage.getItem("cart")) || [];

    const exists = cart.find(item => item.id == gameId);

    if (exists) {
        buyBtn.innerText = "Added to Cart";
        buyBtn.style.background = "#333";
        buyBtn.disabled = true;
    } else {
        buyBtn.innerText = "Buy Now";
        buyBtn.style.background = "";
        buyBtn.disabled = false;
    }
}

function startAutoScroll() {
    scrollInterval = setInterval(() => {
        shiftSlide(1);
    }, 5000); 
}

function stopAutoScroll() {
    clearInterval(scrollInterval);
}

function shiftSlide(direction) {
    const slideWidth = carousel.clientWidth;
    const maxScroll = carousel.scrollWidth - slideWidth;
    
    if (direction === 1 && carousel.scrollLeft >= maxScroll - 5) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
    } else if (direction === -1 && carousel.scrollLeft <= 5) {
        carousel.scrollTo({ left: maxScroll, behavior: 'smooth' });
    } else {
        carousel.scrollBy({ left: slideWidth * direction, behavior: 'smooth' });
    }
}

// Buttons
nextBtn.addEventListener('click', () => {
    shiftSlide(1);
    resetTimer();
});

prevBtn.addEventListener('click', () => {
    shiftSlide(-1);
    resetTimer();
});

// Hover
carousel.addEventListener('mouseenter', stopAutoScroll);
carousel.addEventListener('mouseleave', startAutoScroll);

function resetTimer() {
    stopAutoScroll();
    startAutoScroll();
}

buyBtn.addEventListener('click', () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        showPopup("Please login to add items to cart", false);
        return;
    }

    const gameData = {
        id: gameId,
        title: document.querySelector(".game-title").innerText,
        price: document.querySelector(".price-tag").innerText,
        category: document.querySelectorAll(".meta-list li strong")[1].innerText,
        image: document.querySelector(".game-logo-box").src
    };

    let cart = JSON.parse(sessionStorage.getItem("cart")) || [];

    const exists = cart.find(item => item.id == gameData.id);

    if (!exists) {
        cart.push(gameData);
        sessionStorage.setItem("cart", JSON.stringify(cart));
    }

    // 🔥 Update button instantly
    updateBuyButtonState();

    showPopup("Game added to cart!", true);
});

function showPopup(message, showActions = true) {
    const old = document.getElementById("cart-popup");
    if (old) old.remove();

    const popup = document.createElement("div");
    popup.id = "cart-popup";

    popup.innerHTML = `
        <div class="popup-overlay"></div>
        <div class="popup-box">
            <h2>${message}</h2>
            ${showActions ? `
                <div class="popup-actions">
                    <button id="continueBtn">Continue Browsing</button>
                    <button id="goCartBtn">Go to Cart</button>
                </div>
            ` : ''}
        </div>
    `;

    document.body.appendChild(popup);

    if (showActions) {
        document.getElementById("continueBtn").onclick = () => popup.remove();
        document.getElementById("goCartBtn").onclick = () => {
            window.location.href = "../cart/base.htm";
        };
    }

    popup.querySelector(".popup-overlay").onclick = () => popup.remove();
}

let wishlisted = false;
wishBtn.addEventListener('click', () => {
    wishlisted = !wishlisted;
    wishBtn.innerText = wishlisted ? "❤ In Wishlist" : "Add to Wishlist";
    wishBtn.style.borderColor = wishlisted ? "var(--accent)" : "#555";
});

loadGame();
startAutoScroll();