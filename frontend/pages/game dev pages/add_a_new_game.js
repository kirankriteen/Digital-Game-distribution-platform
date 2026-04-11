// Wait until DOM is fully loaded
document.addEventListener("DOMContentLoaded", () => {

    const token = localStorage.getItem("accessToken");

    // ================= THEME SYSTEM =================
    const genreThemes = {
        "Action": {
            primary: "#f43f5e",
            card: "#1c1917",
            body: "#0c0a09"
        },
        "RPG": {
            primary: "#8b5cf6",
            card: "#1e293b",
            body: "#020617"
        },
        "Horror": {
            primary: "#7f1d1d",
            card: "#1a0a0a",
            body: "#050000"
        },
        "Simulation": {
            primary: "#10b981",
            card: "#18181b",
            body: "#09090b"
        }
    };

    const root = document.documentElement;

    function updateTheme(genre) {
        const theme = genreThemes[genre];
        if (!theme) return;

        root.style.setProperty('--primary', theme.primary);
        root.style.setProperty('--bg-card', theme.card);
        root.style.setProperty('--bg-body', theme.body);
    }

    // ================= INPUT REFERENCES =================
    const inTitle = document.getElementById("inTitle");
    const inGenre = document.getElementById("inGenre");
    const inPrice = document.getElementById("inPrice");
    const inCoverPreview = document.getElementById("inCoverPreview");

    const preTitle = document.getElementById("preTitle");
    const preGenre = document.getElementById("preGenre");
    const prePrice = document.getElementById("prePrice");
    const preImg = document.getElementById("preImg");

    // ================= LIVE PREVIEW =================
    inTitle.addEventListener("input", () => {
        preTitle.innerText = inTitle.value || "Untitled Game";
    });

    inGenre.addEventListener("change", () => {
        preGenre.innerText = inGenre.value;

        // 🔥 ALSO update theme here
        updateTheme(inGenre.value);
    });

    inPrice.addEventListener("input", () => {
        prePrice.innerText = inPrice.value ? "$" + inPrice.value : "Free";
    });

    inCoverPreview.addEventListener("change", () => {
        const file = inCoverPreview.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            preImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    // ================= ZIP CLICK HANDLING =================
    document.getElementById("gameZipZone").addEventListener("click", () => {
        document.getElementById("inGameZip").click();
    });

    document.getElementById("assetsZipZone").addEventListener("click", () => {
        document.getElementById("inAssetsZip").click();
    });

    document.getElementById("inGameZip").addEventListener("change", (e) => {
        document.getElementById("gameZipLabel").innerText = e.target.files[0]?.name || "Upload Game ZIP";
    });

    document.getElementById("inAssetsZip").addEventListener("change", (e) => {
        document.getElementById("assetsZipLabel").innerText = e.target.files[0]?.name || "Upload Assets ZIP";
    });

    // ================= FORM SUBMIT =================
    document.getElementById("gameForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = inTitle.value;
        const genre = inGenre.value;
        const price = inPrice.value;
        const bio = document.getElementById("inBio").value;

        const os = document.getElementById("inOS").value;
        const processor = document.getElementById("inProcessor").value;
        const memory = document.getElementById("inMemory").value;
        const storage = document.getElementById("inStorage").value;

        const gameZip = document.getElementById("inGameZip").files[0];
        const assetsZip = document.getElementById("inAssetsZip").files[0];

        if (!gameZip || !assetsZip) {
            alert("Upload both ZIP files");
            return;
        }

        try {
            // STEP 1: Get presigned URL
            const res = await fetch("/games/upload-url", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    filename: gameZip.name,
                    title,
                    genre,
                    price,
                    bio,
                    os,
                    processor,
                    memory,
                    storage
                })
            });

            const data = await res.json();
            const presignedUrl = data.uploadUrl;
            const gameId = data.gameId;

            // STEP 2: Upload game ZIP
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

                    // STEP 3: Confirm upload
                    await fetch("/games/upload-complete", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + token
                        },
                        body: JSON.stringify({ gameId })
                    });

                    // STEP 4: Upload assets ZIP
                    const formData = new FormData();
                    formData.append("zipfile", assetsZip);
                    formData.append("gameId", gameId);

                    const zipRes = await fetch("/games/upload-zip", {
                        method: "POST",
                        headers: {
                            "Authorization": "Bearer " + token
                        },
                        body: formData
                    });

                    const zipData = await zipRes.json();

                    if (zipData.success) {
                        alert("🎉 Game Published Successfully!");
                        document.getElementById("gameForm").reset();
                    } else {
                        alert("Assets upload failed");
                    }

                } else {
                    alert("Upload failed");
                }
            };

            xhr.send(gameZip);

        } catch (err) {
            console.error(err);
            alert("Server error");
        }
    });

});