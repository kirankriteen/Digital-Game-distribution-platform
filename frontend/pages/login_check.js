document.getElementById("loginBtn").addEventListener("click", async (e) => {
    e.preventDefault(); // IMPORTANT (explained below)

    const username = document.getElementById("logemail").value;
    const password = document.getElementById("logpass").value;
    console.log(username)

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
    console.log(data.accessToken)
    console.log(data.refreshToken)
    } else {
    alert("Login failed");
    console.log("Login failed")
    }
});
