const express = require('express')
const { authenticateToken, authenticateRole } = require('../middleware/auth')
const { pool } = require('../db/pool')
const { ROLE } = require('../data')

const router = express.Router()
router.use(express.json())

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

router.get('/game', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
    try {
        const user_id = req.user.id;
        const game_id = req.query.game_id;

        const [projectsRows] = await pool.query(
            `SELECT g.*
             FROM user_games ug
             JOIN games g ON ug.game_id = g.game_id
             WHERE ug.user_id = ? AND ug.game_id = ?`,
            [user_id, game_id]
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

        res.json({
            mygames: projects
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
})

module.exports = router