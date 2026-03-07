const express = require('express')
const { authenticateToken, setUser, authenticateRole } = require('../middleware/auth')
const { pool } = require('../db/pool')
const { ROLE } = require('../data')

const router = express.Router()
router.use(express.json())

router.get('/', authenticateToken, authenticateRole(ROLE.USER), async (req, res) => {
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

async function getDeveloperId(user_id) {

    const [rows] = await pool.query(
        `SELECT d.dev_id
         FROM developer d
         JOIN userLogin u ON d.user_id = u.user_id
         JOIN roles r ON u.role_id = r.role_id
         WHERE u.user_id = ? AND r.role = ?`,
        [user_id, ROLE.DEVELOPER]
    );

    if (rows.length === 0) {
        throw { status: 403, message: 'User is not a developer' };
    }

    return rows[0].dev_id;
}

router.get('/dashboard', authenticateToken, authenticateRole(ROLE.DEVELOPER), async (req, res) => {

    try {
        const dev_id = await getDeveloperId(req.user.id);

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

router.get('/mygames', authenticateToken, authenticateRole(ROLE.DEVELOPER), async (req, res) => {

    try {
        const dev_id = await getDeveloperId(req.user.id);

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

router.get('/account', authenticateToken, authenticateRole(ROLE.DEVELOPER), async (req, res) => {

    try {
        const dev_id = await getDeveloperId(req.user.id);

        const [devRows] = await pool.query(
            `SELECT d.studio_name, d.email, d.bio, d.password_hash,
                    c.name AS preferred_currency,
                    l.language AS preferred_language
             FROM developer d
             LEFT JOIN currency c ON d.currency_id = c.currency_id
             LEFT JOIN language l ON d.language_id = l.lang_id
             WHERE d.dev_id = ?`,
            [dev_id]
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

// module.exports = {router, getDeveloperId }
module.exports = router


/*
1. Should still make save changes from the server.
2. Authentication is also should be done.
*/