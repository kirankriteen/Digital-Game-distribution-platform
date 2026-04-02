const button = document.querySelector("button")
button.addEventListener("click", () => {
    fetch("http://localhost:3000/pay/games-checkout", {
    // fetch("http://localhost:3000/pay/onboard", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6InNhbGx5IiwiaWF0IjoxNzc1MTI0MzcyLCJleHAiOjE3NzUyMTA3NzJ9.dLCc4o3li6zCuCYC82l1YmWOVX1XqtddEW7RWhcQnjI'
        },
        body: JSON.stringify({
            games: [
                // { title: "clone wars" },
                // { title: 'the night sky'}
                {title: 'cricket07'}
            ]
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