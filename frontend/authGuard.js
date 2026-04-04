(function () {
    const token = localStorage.getItem("accessToken");

    if (!token) {
        console.warn("No token found → redirecting to login");
        window.location.href = "/pages/login/signup_login.htm";
        return;
    }

    // OPTIONAL: check expiry (advanced but useful)
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;

        if (Date.now() > exp) {
            console.warn("Token expired → redirecting");
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");

            window.location.href = "/pages/login/signup_login.htm";
        }
    } catch (err) {
        console.error("Invalid token");
        window.location.href = "/pages/login/signup_login.htm";
    }
})();