const jwt = require('jsonwebtoken')
const { ROLE, users, projects } = require('../data')

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

function setUser(req, res, next) {
    if(!req.user) return res.sendStatus(401)
    const userId = req.user.id
    if(userId) {
        const user = users.find(u => u.id === userId)
        if(!user) return res.sendStatus(404)
        req.user = user
    } else {
        req.user = null
    }
    next()
}

module.exports = {
    authenticateToken, 
    setUser
}