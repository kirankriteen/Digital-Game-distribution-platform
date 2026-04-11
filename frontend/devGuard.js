window.addEventListener("load", async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        window.location.href = "/pages/login/signup_login.htm";
        return;
    }

    try {
        const response = await fetch("/dev/check", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            throw new Error("Not a developer");
        }

        console.log("Developer verified ✅");

    } catch (err) {
        console.error("Access denied:", err);
        alert("You are not a developer");

        window.location.href = "/base.html";
    }
});