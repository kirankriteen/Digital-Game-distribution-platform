document.getElementById("loginBtn").addEventListener("click", async (e) => {
    e.preventDefault(); // IMPORTANT (explained below)

    const username = document.getElementById("loginemail").value;
    const password = document.getElementById("loginpass").value;

    const response = await fetch("http://localhost:4000/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,  
            password: password
        })
    });

    const data = await response.json();

    if (data.accessToken) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    alert("Login successful");
    console.log("Login completed")
    } else {
    alert("Login failed");
    console.log("Login failed")
    }
});
