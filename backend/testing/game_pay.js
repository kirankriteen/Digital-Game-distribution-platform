const button = document.querySelector("button")
button.addEventListener("click", () => {
    fetch("http://localhost:3000/pay/game-checkout", {
    // fetch("http://localhost:3000/pay/onboard", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6Imt5bGUiLCJpYXQiOjE3NzQwODgwNDIsImV4cCI6MTc3NDE3NDQ0Mn0.mgX02H0uz0FeQf_rdRQW3tPpIxEVSPRAJvoezpd3f6U'
        },
        body: JSON.stringify({
            title: 'clone wars'
        }),
    })
        .then(res => {
            if (res.ok) return res.json()
            return res.json().then(json => Promise.reject(json))
        })
        .then(({ url }) => {
            window.location = url
        })
        .catch(e => {
            console.error(e.error)
        })
})