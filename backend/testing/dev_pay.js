const button = document.querySelector("button")
button.addEventListener("click", () => {
    fetch("http://localhost:3000/pay/dev-checkout", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwibmFtZSI6InNhbGx5IiwiaWF0IjoxNzc0MzQ4NDEwLCJleHAiOjE3NzQ0MzQ4MTB9.9H7yzLkXk8mTljkeRFmkygV13MVW4iQFasXAxtPd2BA'
        },
        body: JSON.stringify({
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