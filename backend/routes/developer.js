const express = require('express')
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt')
const fs = require('fs');
const { authenticateToken, setUser, authenticateRole } = require('../middleware/auth')
const { pool } = require('../db/pool')
const { ROLE } = require('../data')

const router = express.Router()
router.use(express.json())

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.get('/', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
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

router.get('/check', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
    const [userRows] = await pool.query(
        `SELECT role_id FROM userLogin WHERE user_id = ?`,
        [req.user.id]
    );

    if(userRows[0].role_id === 2) {
        return res.sendStatus(200)
    } else if(userRows[0].role_id < 2) {
        return res.sendStatus(403)
    }
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

async function getCurrencyId(name) {
    const [rows] = await pool.query(
        `SELECT currency_id FROM currency WHERE name = ?`,
        [name]
    );

    if (rows.length === 0) {
        throw { status: 403, message: `No currency named ${name}` };
    }

    return rows[0].currency_id;

}

async function getLanguageId(name) {
    const [rows] = await pool.query(
        `SELECT lang_id FROM language WHERE language = ?`,
        [name]
    );

    if (rows.length === 0) {
        throw { status: 403, message: `No language named ${name}` };
    }

    return rows[0].lang_id;

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
            `SELECT d.studio_name, d.email, d.bio, d.password_hash, d.imglocation,
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
        const host = req.headers.host || 'localhost:3000';
        const imageUrl = `http://${host}${dev.imglocation}`;
        console.log(imageUrl)

        res.json({
            studio_name: dev.studio_name,
            email: dev.email,
            bio: dev.bio,
            preferred_currency: dev.preferred_currency,
            preferred_language: dev.preferred_language,
            imageUrl: imageUrl
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
})

router.patch('/account', authenticateToken, authenticateRole(ROLE.DEVELOPER), upload.single('image'), async (req, res) => {
    try {
        const dev_id = await getDeveloperId(req.user.id);

        const { studio_name, email, bio, currency, language, old_password, new_password } = req.body;
 
        let fields = [];
        let values = [];

        if (studio_name) {
            fields.push('studio_name = ?');
            values.push(studio_name);
        }

        if (email) {
            fields.push('email = ?');
            values.push(email);
        }

        if (bio) {
            fields.push('bio = ?');
            values.push(bio);
        }

        if (currency) {
            const currency_id = await getCurrencyId(currency);
            fields.push('currency_id = ?');
            values.push(currency_id);
        }

        if (language) {
            const language_id = await getLanguageId(language);
            fields.push('language_id = ?');
            values.push(language_id);
        }

        if (old_password && new_password) {
            const [old] = await pool.query(`SELECT password_hash FROM developer WHERE dev_id = ?`, [dev_id])
            old_hash = old[0].password_hash
            const isMatch = await bcrypt.compare(old_password, old_hash);
            if (isMatch) {
                const password_hash = await bcrypt.hash(new_password, 10)
                fields.push('password_hash = ?');
                values.push(password_hash);
            }

        }

        if (req.file) {
            const [oldData] = await pool.query(
                'SELECT imglocation FROM developer WHERE dev_id = ?',
                [dev_id]
            );

            if (oldData[0]?.imglocation) {
                const oldPath = path.join(__dirname, '../', oldData[0].imglocation);
                fs.unlink(oldPath, err => {
                    if (err) console.error('Failed to delete old image:', err);
                });
            }

            fields.push('imglocation = ?');
            values.push(`/uploads/${req.file.filename}`);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields provided to update' });
        }

        values.push(dev_id);

        const query = `UPDATE developer SET ${fields.join(', ')} WHERE dev_id = ?`;
        await pool.query(query, values);

        res.json({ success: true, message: 'Profile updated successfully' });



    } catch(err) {
        console.error(err);
        if (req.file) {
            fs.unlink(
                path.join(__dirname, '../uploads', req.file.filename),
                () => { }
            );
        }

        res.status(500).json({ message: 'Server error' });
    }
})

router.post('/create-account', authenticateToken, authenticateRole(ROLE.DEVELOPER), async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT dev_id
         FROM developer
         WHERE user_id = ?`,
            [req.user.id]
        );

        if (rows.length !== 0) {
            console.log('multiple user account creation')
            return res.status(400).json({ error: 'User already exists' });
        }

        const { studio_name, email, bio, currency, language, password } = req.body

        // Hash the password
        const password_hash = await bcrypt.hash(password, 10)

        // Get currencyId, languageId
        const currency_id = await getCurrencyId(currency);
        const language_id = await getLanguageId(language);
        const query = `INSERT INTO developer(user_id, studio_name, email, bio, currency_id, language_id, password_hash)
        VALUES(?, ?, ?, ?, ?, ?, ?)`
        const [devRows] = await pool.query(query, [req.user.id, studio_name, email, bio, currency_id, language_id, password_hash])

        console.log(devRows[0])

        res.status(201).json({
            success: true,
            message: 'Developer account created successfully',
            developerId: devRows.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
})

// module.exports = {router, getDeveloperId }
module.exports = router


/*
1. Should still make save changes from the server.
2. Authentication is also should be done.
*/