require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const bcrypt = require('bcrypt')
const PORT = 4000
const { userData } = require('./data')

const mysql = require('mysql2')

const jwt = require('jsonwebtoken')

app.use(express.json())

app.use(cors({origin: "http://127.0.0.1:60333"}));

let refreshTokens = []

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'password123',
    database: 'game_distribution'
}).promise()

app.post('/token', (req, res) => {
    const refreshToken = req.body.token
    if (!refreshToken) return res.sendStatus(401)

    if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403)

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403)
        const payload = {
            id: user.id,
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
        id: user.id,
        name: user.username
    }
    const accessToken = generateAccessToken(payload)
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET)
    refreshTokens.push(refreshToken)
    res.json({ accessToken: accessToken, refreshToken: refreshToken })
})

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '60s' })
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
        console.log(user.password)
        const isMatch = await bcrypt.compare(req.body.password, user.password_hash);

        if (isMatch) {
            req.user = user;
            next();
        } else {
            res.status(401).send('Invalid credentials');
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