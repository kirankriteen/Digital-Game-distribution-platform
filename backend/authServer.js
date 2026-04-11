require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const PORT = 4000
const { userData } = require('./data')
const { pool } = require('./db/pool')
const { connectDB } = require('./db/mongodb');
const { User, Group, Message } = require('./db/models')

const jwt = require('jsonwebtoken')

app.use(express.json())

connectDB();

//app.use(cors({ origin: "http://127.0.0.1:5501" }));
//app.use(cors({ origin: "http://localhost:3000" }));
app.use(cors());

let refreshTokens = []
let userTokens = []

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASS
    }
});

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
        const sql = 'INSERT INTO userLogin (username, password_hash, fullname, role_id) VALUES (?, ?, ?, ?)';
        const [result] = await pool.execute(sql, [email, hashedPassword, fullName, 1]);

        const userId = result.insertId;
        await User.create({
            user_id: userId,
            username: fullName,
            avatar: null,
            status: "offline"
        });

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

app.post('/forgot-password', async (req, res) => {
    try {
        const email = req.body.username;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const [userRows] = await pool.query(
            `SELECT user_id FROM userlogin WHERE
            username = ?`,
            [email]
        )
        if(userRows.length === 0) {
            return res.status(400).json({ error: 'User does not exist' });
        }
        const user_id = userRows[0].user_id;

        const token = crypto.randomBytes(32).toString('hex');
        userTokens.push({
            userId: user_id,
            email: email,
            token: token,
            expiresAt: Date.now() + 3600000 // 1 hour
        });

        const resetLink = `http://localhost:3000/reset-password?token=${token}`;

        await transporter.verify();

        await transporter.sendMail({
            from: `"Support Team" <${process.env.EMAIL}>`,
            to: email,
            subject: "Password Reset Request",
            html: `
                <h3>Reset Your Password</h3>
                <p>Click the link below:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>This link expires in 1 hour.</p>
            `
        });

        res.status(200).json({ message: 'Reset email sent successfully' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
})

app.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword} = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and password required" });
        }

        const tokenEntryIndex = userTokens.findIndex(
            t => t.token === token && t.expiresAt > Date.now()
        );

        if (tokenEntryIndex === -1) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        const tokenEntry = userTokens[tokenEntryIndex];
        const user_id = tokenEntry.userId;

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!newPassword || !passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: 'Password must be at least 8 characters and include uppercase, lowercase, and a number' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query(
            `UPDATE userlogin SET password_hash = ?
            WHERE user_id = ?`,
            [hashedPassword, user_id]
        )

        userTokens.splice(tokenEntryIndex, 1);
        res.json({ message: "Password reset successful" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
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