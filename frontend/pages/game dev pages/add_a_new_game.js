const token = localStorage.getItem("accessToken");

if (!token) {
    alert("Please login first");
    window.location.href = "../../login/signup_login.htm";
}

// ==========================
// ELEMENTS
// ==========================
const form = document.getElementById("gameForm");
const titleInput = document.getElementById("inTitle");
const genreInput = document.getElementById("inGenre");
const buildInput = document.getElementById("inBuild");
const thumbInput = document.getElementById("inThumb");

// Preview elements
const preTitle = document.getElementById("preTitle");
const preGenre = document.getElementById("preGenre");
const preImg = document.getElementById("preImg");

// ==========================
// LIVE PREVIEW
// ==========================
titleInput.addEventListener("input", () => {
    preTitle.innerText = titleInput.value || "Untitled Game";
});

genreInput.addEventListener("change", () => {
    preGenre.innerText = genreInput.value;
});

thumbInput.addEventListener("change", () => {
    const file = thumbInput.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        preImg.src = url;
    }
});

// ==========================
// SUBMIT GAME
// ==========================
form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const genre = genreInput.value;
    const file = buildInput.files[0];

    if (!title || !genre || !file) {
        alert("Please fill all fields and upload game file");
        return;
    }

    try {
        // =========================
        // STEP 1: Get presigned URL
        // =========================
        const res = await fetch("http://localhost:3000/games/upload-url", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            body: JSON.stringify({
                filename: file.name,
                title: title,
                genre: genre,
                price: 0   // default FREE
            })
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(err || "Failed to get upload URL");
        }

        const data = await res.json();
        const presignedUrl = data.uploadUrl;
        const gameId = data.gameId;

        console.log("Game ID:", gameId);

        // =========================
        // STEP 2: Upload file
        // =========================
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignedUrl, true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                console.log("Upload:", percent + "%");
            }
        };

        xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {

                // =========================
                // STEP 3: Notify backend
                // =========================
                const notifyRes = await fetch("http://localhost:3000/games/upload-complete", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + token
                    },
                    body: JSON.stringify({ gameId })
                });

                const notifyData = await notifyRes.json();

                if (notifyData.success) {
                    alert("🎉 Game published successfully!");

                    // Reset form
                    form.reset();
                    preTitle.innerText = "Untitled Game";
                    preGenre.innerText = "Genre";
                    preImg.src = "https://via.placeholder.com/400x200?text=Game+Cover";

                } else {
                    alert("Upload done but server failed");
                }

            } else {
                alert("Upload failed: " + xhr.status);
            }
        };

        xhr.onerror = () => {
            alert("Upload error");
        };

        xhr.send(file);

    } catch (err) {
        console.error("Error:", err);
        alert(err.message);
    }
});