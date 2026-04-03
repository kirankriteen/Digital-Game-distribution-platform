require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const bcrypt = require('bcrypt')
const PORT = 4000
const { userData } = require('./data')
const { pool } = require('./db/pool')

const jwt = require('jsonwebtoken')

app.use(express.json())

//app.use(cors({ origin: "http://127.0.0.1:5501" }));
//app.use(cors({ origin: "http://localhost:3000" }));
app.use(cors());

let refreshTokens = []

app.post('/token', (req, res) => {
    const refreshToken = req.body.token
    if (!refreshToken) return res.sendStatus(401)

    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        const payload = {
            id: user.user_id,
            name: user.username
        }
        const accessToken = generateAccessToken(payload)
        res.json({ accessToken: accessToken })
    })
})

app.delete('/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token)
    res.sendStatus(204)
})

app.post('/login', authenticateUser, (req, res) => {
    const user = req.user
    const payload = {
        id: user.user_id,
        name: user.username
    }
    const accessToken = generateAccessToken(payload)
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET)
    refreshTokens.push(refreshToken)
    res.json({ accessToken: accessToken, refreshToken: refreshToken })
})

app.post('/signup', async (req, res) => {
    try {
        const fullName = req.body.fullName
        const email = req.body.email
        const password = req.body.password

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!password || !passwordRegex.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and include uppercase, lowercase, and a number' });
        }

        if (!fullName || fullName.length < 2) {
            return res.status(400).json({ error: 'Full name is required and must be at least 2 characters' });
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const sql = 'INSERT INTO userLogin (username, password_hash, fullname) VALUES (?, ?, ?)';
        const [result] = await pool.execute(sql, [email, hashedPassword, fullName]);

        res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
    }
    catch(err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }

})

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
}

async function authenticateUser(req, res, next) {
    try {
        // Connect to the database
        const [rows] = await pool.execute(
            'SELECT * FROM userLogin WHERE username = ?',
            [req.body.username]
        );
        // Find user from the database
        if (rows.length === 0) {
            return res.status(400).send('Cannot find user');
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(req.body.password, user.password_hash);

        if (isMatch) {
            req.user = user;
            next();
        } else {
            return res.status(403).json({ message: "Wrong password" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }

    /*
    const user = userData.find(user => user.username === req.body.username)
    if(!user) {
        return res.status(400).send('Cannot find user')
    }
    
        if(await bcrypt.compare(req.body.password, user.password)) {
            req.user = user
            next()
        } else {
            res.send('Invalid credentials')
        }
    } catch {
        res.status(500).send()
    }
    */
}

app.listen(PORT)