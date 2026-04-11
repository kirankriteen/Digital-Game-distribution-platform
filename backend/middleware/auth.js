const jwt = require('jsonwebtoken')
const { ROLE, users, projects } = require('../data')
const { pool } = require('../db/pool')

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (!token) {
        return res.sendStatus(401)
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403)
        }
        req.user = user
        next()
    })
}

function setUser(req, res, next) {
    if (!req.user) return res.sendStatus(401)
    const userId = req.user.id
    if (userId) {
        const user = users.find(u => u.id === userId)
        if (!user) return res.sendStatus(404)
        req.user = user
    } else {
        req.user = null
    }
    next()
}

function authenticateRole(roles) {
    if (!Array.isArray(roles)) roles = [roles];

    return async (req, res, next) => {
        if (!req.user) return res.sendStatus(401)     
        const userId = req.user.id
        
        if (userId) {
            try {
                const [userRows] = await pool.query(
                    `SELECT role_id FROM userLogin WHERE user_id = ?`,
                    [userId]
                )
                if (userRows.length === 0) {
                    return res.status(404).json({ message: 'User not found' });
                }

                const role_id = userRows[0].role_id;
                
                const [roleRows] = await pool.query(
                    `SELECT role FROM roles WHERE role_id = ?`,
                    [role_id]
                )
                const tableRole = roleRows[0].role;

                if (!roles.includes(tableRole)) {
                    return res.status(403).json({ message: 'You cannot access dev page' })
                }
            } catch (err) {
                console.error(err);
                res.status(500).json({ message: 'Server error' });
            }
        }
        next();
    }
}

module.exports = {
    authenticateToken,
    setUser,
    authenticateRole
}