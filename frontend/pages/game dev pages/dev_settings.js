const token = localStorage.getItem("accessToken");

async function loadSettings() {
    try {
        const response = await fetch("/dev/account", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            throw new Error("Unauthorized");
        }

        const data = await response.json();
        console.log("Settings data:", data);

        // Fill fields
        document.getElementById("studioName").value = data.studio_name || "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("bio").value = data.bio || "";

        document.getElementById("currency").value = (data.preferred_currency || "").toLowerCase();
        document.getElementById("language").value = (data.preferred_language || "").toLowerCase();

        // Image (if exists)
        if (data.imageUrl) {
            document.getElementById("profileImage").src = data.imageUrl;
        }

    } catch (error) {
        console.error("Settings load failed:", error);

        // fallback (same style as dashboard)
        console.log("Running in no-auth mode");

        document.getElementById("studioName").value = "";
        document.getElementById("email").value = "";
        document.getElementById("bio").value = "";
    }
}

loadSettings();

document.getElementById("saveBtn").addEventListener("click", async () => {

    const formData = new FormData();

    // 🔹 Collect values
    const studioName = document.getElementById("studioName").value;
    const email = document.getElementById("email").value;
    const bio = document.getElementById("bio").value;
    const currency = document.getElementById("currency").value;
    const language = document.getElementById("language").value;
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const imageFile = document.getElementById("imageInput").files[0];

    // 🔹 Append only if exists (IMPORTANT)
    if (studioName) formData.append("studio_name", studioName);
    if (email) formData.append("email", email);
    if (bio) formData.append("bio", bio);
    if (currency) formData.append("currency", currency);
    if (language) formData.append("language", language);

    // 🔐 Password logic
    if (newPassword) {
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        formData.append("old_password", oldPassword);
        formData.append("new_password", newPassword);
    }

    // 🖼 Image
    if (imageFile) {
        formData.append("image", imageFile);
    }

    try {
        const res = await fetch("/dev/account", {
            method: "PATCH",
            headers: {
                "Authorization": "Bearer " + token
            },
            body: formData
        });

        const data = await res.json();

        if (data.success) {
            alert("Profile updated successfully ✅");
            loadSettings(); 
        } else {
            alert(data.message || "Update failed");
        }

    } catch (err) {
        console.error("Update error:", err);
        alert("Server error");
    }
});

document.getElementById("deleteAccountBtn").addEventListener("click", async () => {

    const confirmDelete = confirm(
        "Are you sure you want to delete your developer account?\n\nAll your games will be permanently deleted."
    );

    if (!confirmDelete) return;

    try {
        const res = await fetch("/dev/delete-account", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        const data = await res.json();

        if (res.ok) {
            alert("Developer account deleted successfully");

            // Clear auth
            localStorage.removeItem("accessToken");

            // Redirect
            window.location.href = "../../base.html";
        } else {
            alert(data.error || "Delete failed");
        }

    } catch (err) {
        console.error("Delete error:", err);
        alert("Server error");
    }
});