const express = require('express');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));

// Serve static files like html, css and js which are in the same folder
app.use(express.static(path.join(__dirname)));

const users = {
    "testuser": hashPassword("password123")
};

function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

app.post('/login', (req, res) => {
    const {username, password}  = req.body;

    if(users[username] && users[username] === hashPassword(password)) {
        res.send("Login Successful!");
    } else {
        res.status(401).send('Invalid credentials');
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});