window.addEventListener("load", async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "/pages/login/signup_login.htm";
        return;
    }

    try {
        const response = await fetch("/my/check", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            throw new Error("Not a user");
        }

        console.log("User verified ✅");

    } catch (err) {
        console.error("Access denied:", err);
        alert("You are not a User");

        window.location.href = "/base.html";
    }
});