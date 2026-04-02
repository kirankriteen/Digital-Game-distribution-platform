const button = document.querySelector("button")
button.addEventListener("click", () => {
    fetch("http://localhost:3000/pay/game-checkout", {
    // fetch("http://localhost:3000/pay/onboard", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwibmFtZSI6Imt5bGUiLCJpYXQiOjE3NzQzNDQ3NzYsImV4cCI6MTc3NDQzMTE3Nn0.6ECso8ekBIX65pbSuQuDymIb1YeYo207iB_2t4k6VTI'
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