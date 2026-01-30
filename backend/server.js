require('dotenv').config()

express = require('express')
const bcrypt = require('bcrypt')
const PORT = 3000
const app = express()
const { ROLE, users, userData, projects } = require('./data')

const jwt = require('jsonwebtoken')

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Home Page')
})

app.get('/me', authenticateToken, (req, res) => {
    res.json(projects.filter(p => p.userId === req.user.id))
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(!token) {
        return res.sendStatus(401)
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if(err) {
            return res.sendStatus(403)
        }
        req.user = user
        next()
    })
}

app.listen(PORT, () => {
    console.log(`Server Runnning at http://localhost:${PORT}`)
})
