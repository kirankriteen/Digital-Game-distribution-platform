const express = require('express')
const mysql = require('mysql2')
const { authenticateToken, setUser } = require('../middleware/auth')

const router = express.Router()
router.use(express.json())

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: 'password123',
    database: 'game_distribution'
}).promise()

router.get('/', authenticateToken, async (req, res) => {
    const [userRows] = await pool.query(
        `SELECT role_id FROM userLogin WHERE user_id = ?`,
        [req.user.id]
    );
    res.json({
        message: 'Hello, this is the dev page',
        user: req.user,
        rows: userRows
    });
})

router.get('/dashboard', authenticateToken, async (req, res) => {
    const user_id = req.user.id;

    try {
        const [userRows] = await pool.query(
            `SELECT role_id FROM userLogin WHERE user_id = ?`,
            [user_id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const role_id = userRows[0].role_id;

        if (role_id !== 2) { // Developer role id is 2
            return res.status(403).json({ message: 'User is not a developer' });
        }

        const [devRows] = await pool.query(
            `SELECT dev_id FROM developer WHERE user_id = ?`,
            [user_id]
        );

        if (devRows.length === 0) {
            return res.status(404).json({ message: 'Developer record not found' });
        }

        const dev_id = devRows[0].dev_id;

        const [dashboardRows] = await pool.query(
            `SELECT total_revenue, downloads, active_players
             FROM dev_dashboard
             WHERE dev_id = ?`,
            [dev_id]
        );

        const dashboard = dashboardRows.length ? dashboardRows[0] : {
            total_revenue: 0,
            downloads: 0,
            active_players: 0
        };

        const [projectsRows] = await pool.query(
            `SELECT g.title
             FROM dev_games dg
             JOIN games g ON dg.game_id = g.game_id
             WHERE dg.dev_id = ?`,
            [dev_id]
        );

        const projects = projectsRows.map(row => row.title);

        res.json({
            total_revenue: dashboard.total_revenue,
            downloads: dashboard.downloads,
            active_players: dashboard.active_players,
            projects: projects
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
})

router.get('/mygames', authenticateToken, async (req, res) => {
    const user_id = req.user.id;

    try {
        const [userRows] = await pool.query(
            `SELECT role_id FROM userLogin WHERE user_id = ?`,
            [user_id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const role_id = userRows[0].role_id;

        if (role_id !== 2) { // Developer role id is 2
            return res.status(403).json({ message: 'User is not a developer' });
        }

        const [devRows] = await pool.query(
            `SELECT dev_id FROM developer WHERE user_id = ?`,
            [user_id]
        );

        if (devRows.length === 0) {
            return res.status(404).json({ message: 'Developer record not found' });
        }

        const dev_id = devRows[0].dev_id;
        const [projectsRows] = await pool.query(
            `SELECT g.title
             FROM dev_games dg
             JOIN games g ON dg.game_id = g.game_id
             WHERE dg.dev_id = ?`,
            [dev_id]
        );

        const projects = projectsRows.map(row => row.title);

        res.json({
            mygames: projects
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
})

router.get('/account', authenticateToken, async (req, res) => {
    const user_id = req.user.id;

    try {
        const [userRows] = await pool.query(
            `SELECT role_id FROM userLogin WHERE user_id = ?`,
            [user_id]
        );

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userRows[0].role_id !== 2) { // 2 = developer
            return res.status(403).json({ message: 'User is not a developer' });
        }

        const [devRows] = await pool.query(
            `SELECT d.studio_name, d.email, d.bio, d.password_hash,
                    c.name AS preferred_currency,
                    l.language AS preferred_language
             FROM developer d
             LEFT JOIN currency c ON d.currency_id = c.currency_id
             LEFT JOIN language l ON d.language_id = l.lang_id
             WHERE d.user_id = ?`,
            [user_id]
        );

        if (devRows.length === 0) {
            return res.status(404).json({ message: 'Developer record not found' });
        }

        const dev = devRows[0];

        res.json({
            studio_name: dev.studio_name,
            email: dev.email,
            bio: dev.bio,
            preferred_currency: dev.preferred_currency,
            preferred_language: dev.preferred_language
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
})

module.exports = router


/*
1. Should still make save changes from the server.
2. Authentication is also should be done.
*/