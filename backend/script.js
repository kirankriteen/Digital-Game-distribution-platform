const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', async(e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const params = new URLSearchParams();
    for (const pair of formData) {
        params.append(pair[0], pair[1]);
    }

    const response = await fetch('/login', {
        method: 'POST',
        body: params,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const message = document.getElementById('message');
    if (response.status === 200) {
        message.textContent = await response.text();
        message.style.color = 'green';
    } else {
        message.textContent = await response.text();
        message.style.color = 'red';
    }
});