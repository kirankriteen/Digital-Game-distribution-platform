// document.getElementById("loginBtn").addEventListener("click", async (e) => {
//     e.preventDefault(); // IMPORTANT (explained below)

//     const username = document.getElementById("logemail").value;
//     const password = document.getElementById("logpass").value;
//     console.log(username)

//     const response = await fetch("http://localhost:4000/login", {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json"
//         },
//         body: JSON.stringify({
//             username: username,  
//             password: password
//         })
//     });

//     const data = await response.json();

//     if (data.accessToken) {
//     localStorage.setItem("accessToken", data.accessToken);
//     localStorage.setItem("refreshToken", data.refreshToken);
//     alert("Login successful");
//     window.location.href = "/base.html";
//     console.log("Login completed")
//     } else {
//     alert("Login failed");
//     console.log("Login failed")
//     }
// });
document.getElementById("loginBtn").addEventListener("click", async (e) => {
    e.preventDefault();

    const username = document.getElementById("logemail").value;
    const password = document.getElementById("logpass").value;

    console.log("Sending:", username, password);

    try {
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

        console.log("Response:", data);

        if (response.ok && data.accessToken) {
            localStorage.setItem("accessToken", data.accessToken);
            localStorage.setItem("refreshToken", data.refreshToken);

            alert("Login successful");

            window.location.href = "/base.html";
        } else {
            console.error("Login failed:", data);
            alert(data.message || "Login failed");
        }

    } catch (error) {
        console.error("Error during login:", error);
        alert("Server error. Check console.");
    }
});

document.getElementById("signupBtn").addEventListener("click", async (e) => {
    e.preventDefault();

    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPass").value;

    console.log("Signup Data:", name, email, password);

    try {
        const response = await fetch("http://localhost:4000/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                fullName: name,
                email: email,
                password: password
            })
        });

        const data = await response.json();

        console.log("Signup Response:", data);

        if (response.ok) {
            alert("Signup successful! Please login.");
        } else {
            alert(data.message || "Signup failed");
        }

    } catch (error) {
        console.error("Signup error:", error);
        alert("Server error during signup");
    }
});