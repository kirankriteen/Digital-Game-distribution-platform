const express = require('express')
const { authenticateToken, authenticateRole } = require('../middleware/auth')
const { pool } = require('../db/pool')
const { ROLE } = require('../data')
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt')

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

router.get('/check', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
    const [userRows] = await pool.query(
        `SELECT role_id FROM userLogin WHERE user_id = ?`,
        [req.user.id]
    );

    if (userRows[0].role_id >= 1) {
        return res.sendStatus(200)
    } else if (userRows[0].role_id < 1) {
        return res.sendStatus(403)
    }
})

router.get('/mygames', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {

    try {
        const user_id = req.user.id;

        const [projectsRows] = await pool.query(
            `SELECT g.*
             FROM user_games ug
             JOIN games g ON ug.game_id = g.game_id
             WHERE ug.user_id = ?`,
            [user_id]
        );

        const projects = await Promise.all(projectsRows.map(async row => {
            // Fetch genre name from genre_id
            const [genreRows] = await pool.query(
                `SELECT genre FROM genre WHERE genre_id = ?`,
                [row.genre_id]
            );
            const genre = genreRows.length ? genreRows[0].genre : 'Unknown';
            const host = req.headers.host || 'localhost:3000';
            const coverUrl = row.cover ? `http://${host}${row.cover}` : null;
            // Return project object
            return {
                game_id: row.game_id,
                title: row.title,
                bio: row.bio,
                genre: genre,
                price: row.price,
                release_date: row.release_date,
                coverUrl: coverUrl
            };
        })
        );

        res.json({
            mygames: projects
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
})

router.get('/game', async (req, res) => {
    try {
        const game_id = req.query.game_id;

        const [projectsRows] = await pool.query(
            `SELECT g.*
             FROM user_games ug
             JOIN games g ON ug.game_id = g.game_id
             WHERE ug.game_id = ?`,
            [game_id]
        );

        const projects = await Promise.all(projectsRows.map(async row => {
            // Fetch genre name from genre_id
            const [genreRows] = await pool.query(
                `SELECT genre FROM genre WHERE genre_id = ?`,
                [row.genre_id]
            );
            const genre = genreRows.length ? genreRows[0].genre : 'Unknown';
            const host = req.headers.host || 'localhost:3000';
            const coverUrl = row.cover ? `http://${host}${row.cover}` : null;
            const videoUrl = row.video ? `http://${host}${row.video}` : null;
            const img1Url = row.img1 ? `http://${host}${row.img1}` : null;
            const img2Url = row.img2 ? `http://${host}${row.img2}` : null;
            const img3Url = row.img3 ? `http://${host}${row.img3}` : null;
            // Return project object
            return {
                game_id: row.game_id,
                title: row.title,
                genre: genre,
                bio: row.bio,
                price: row.price,
                videoUrl: videoUrl,
                img1Url: img1Url,
                img2Url: img2Url,
                img3Url: img3Url,
                release_date: row.release_date,
                coverUrl: coverUrl,
                os: row.os,
                processor: row.processor,
                memory: row.memory,
                storage: row.storage
            };
        })
        );

        const [devRows] = await pool.query(
            `SELECT u.fullname, d.studio_name 
            FROM developer d
            JOIN userlogin u ON d.user_id = u.user_id
            JOIN dev_games dg ON d.dev_id = dg.dev_id
            WHERE dg.game_id = ?`,
            [game_id]
        )

        const fullname = devRows[0] ? devRows[0].fullname : null
        const studio_name = devRows[0] ? devRows[0].studio_name : null

        res.json({
            mygames: projects,
            fullname: fullname,
            studio_name: studio_name
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
})

router.get('/search', async (req, res) => {
    try {
        const [gameRows] = await pool.query(
  `SELECT 
      g.game_id,
      g.title,
      g.cover,
      g.release_date,
      ge.genre,
      COUNT(ug.game_id) AS downloads
   FROM games g
   JOIN genre ge ON g.genre_id = ge.genre_id
   LEFT JOIN user_games ug ON g.game_id = ug.game_id
   GROUP BY g.game_id, g.title, g.cover, g.release_date, ge.genre`
);
        const host = req.headers.host || 'localhost:3000';
        const games = gameRows.map(row => ({
            game_id: row.game_id,
            title: row.title,
            coverUrl: row.cover ? `http://${host}${row.cover}` : null,
            genre: row.genre,
            release_date: row.release_date,
            downloads: row.downloads
        }));

        res.json({
            games
        });

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server Error" });
    }
})

router.post('/add-wishlist', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
    try {
        const user_id = req.user.id;
        const game_id = req.body.game_id

        const [gameRows] = await pool.query(
            `SELECT * FROM games WHERE game_id = ?`,
            [game_id]
        )
        if (gameRows.length === 0) {
            return res.status(404).json({ error: 'Game not found with the game Id' });
        }

        await pool.query(
            `INSERT INTO wishlist(user_id, game_id)
            VALUES(?, ?)`,
            [user_id, game_id]
        )
        res.json({
            success: true,
            message: 'inserted into wishlist'
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server Error" });
    }
})

router.post('/remove-wishlist', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
    try {
        const user_id = req.user.id;
        const game_id = req.body.game_id

        const [gameRows] = await pool.query(
            `SELECT * FROM wishlist WHERE game_id = ?`,
            [game_id]
        )
        if (gameRows.length === 0) {
            return res.status(404).json({ error: 'Game not found in wishlist with the game Id' });
        }

        await pool.query(
            `DELETE FROM wishlist WHERE user_id = ? AND game_id = ?`,
            [user_id, game_id]
        )
        res.json({
            success: true,
            message: 'deleted from wishlist'
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server Error" });
    }
})

router.get('/wishlist', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
    try {
        const user_id = req.user.id;

        const [games] = await pool.query(
            `SELECT game_id FROM wishlist WHERE user_id = ?`,
            [user_id]
        )
        res.json({
            games
        })

    } catch (err) {
        console.log(err)
        res.status(500).json({ error: "Server Error" });
    }
})

router.get('/account', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
    try {
        const user_id = req.user.id

        const [userRows] = await pool.query(
            `SELECT * FROM userlogin WHERE user_id = ?`,
            [user_id]
        )

        if (userRows.length === 0) {
            return res.status(404).json({ message: 'User record not found' });
        }

        const user = userRows[0];
        const host = req.headers.host || 'localhost:3000';
        const imageUrl = `http://${host}${user.imglocation}`;
        console.log(imageUrl)

        res.json({
            display_name: user.fullname,
            email: user.username,
            age: user.age,
            imageUrl: imageUrl
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
})

router.patch('/account', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
    try {
        const user_id = req.user.id;
        const { fullname, username, age, old_password, new_password } = req.body;

        let fields = [];
        let values = [];

        if (fullname) {
            fields.push('fullname = ?');
            values.push(fullname)
        }

        if (username) {
            fields.push('username = ?');
            values.push(username)
        }

        if (age) {
            fields.push('age = ?');
            values.push(age)
        }

        if (old_password && new_password) {
            const [old] = await pool.query(`SELECT password_hash FROM userlogin WHERE user_id = ?`, [user_id])
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
                'SELECT imglocation FROM userlogin WHERE user_id = ?',
                [user_id]
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

        values.push(user_id);

        const query = `UPDATE userlogin SET ${fields.join(', ')} WHERE user_id = ?`;
        await pool.query(query, values);

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (err) {
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

module.exports = router