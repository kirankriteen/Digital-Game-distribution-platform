const express = require('express')
const path = require('path')
const { pool } = require('../db/pool')
const { minioClient } = require('../db/minioclient')
const Minio = require('minio');
const { ROLE } = require('../data')
// const { authenticateToken, authenticateRole } = require('../middleware/auth')
const { getDeveloperId } = require('./developer')
const router = express.Router()
router.use(express.json())

router.get('/', (req, res) => {
  res.send('Games Page')
})

router.get('/upload-url', async (req, res) => {
  try {
    const filename = req.query.filename;
    if (!filename) {
      return res.status(400).send('Filename is required');
    }

    const presignedUrl = await minioClient.presignedPutObject(
      'mybucket',
      filename,
      24 * 60 * 60
    );

    console.log('Presigned URL:', presignedUrl);
    res.json({ url: presignedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating presigned URL');
  }
});

// async function getGenreId(genre) {
//   const [genreRows] = await pool.query(
//     `SELECT genre_id FROM genre WHERE genre = ?`,
//     [genre]
//   )
//   if (genreRows.length === 0) {
//     throw { status: 403, message: 'Not defined genre' };
//   }

//   return genreRows[0].genre_id;
// }

// router.post('/upload-url', async (req, res) => {

//   try {
//     req.user = { id: 1 };
//     // Get data from the client
//     const { filename, title, genre } = req.body;
//     if (!filename || !title || !genre) {
//       return res.status(400).json({ error: "Missing fields" });
//     }
//     // insert into the database the data with status not uploaded
//     // const dev_id = await getDeveloperId(req.user.id);
//     const dev_id = 2;
//     const genre_id = await getGenreId(genre);
//     const [gameResult] = await pool.query(
//       `INSERT INTO games 
//        (title, genre_id, filelocation, filestatus)
//        VALUES (?, ?, ?, ?)`,
//       [title, genre_id, `/${filename}`, "pending"]
//     );
//     const gameId = gameResult.insertId;
//     await pool.query(
//       `INSERT INTO dev_games (dev_id, game_id)
//        VALUES (?, ?)`,
//       [dev_id, gameId]
//     );


//     // send the url
//     const presignedUrl = await minioClient.presignedPutObject(
//       'mybucket',
//       filename,
//       24 * 60 * 60
//     );

//     res.json({
//       uploadUrl: presignedUrl,
//       gameId,
//       filename,
//       title,
//       genre
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Error generating presigned URL', details: err.message });
//   }
// })

router.get('/download-url', async (req, res) => {
  try {
    const filename = req.query.filename;
    if (!filename) {
      return res.status(400).send('Filename is required');
    }

    const presignedUrl = await minioClient.presignedGetObject(
      'mybucket',
      filename,
      24 * 60 * 60
    )
    console.log('Download URL:', presignedUrl);
    res.json({ url: presignedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating presigned download URL');
  }
})

router.post('/upload-complete', async (req, res) => {
  const { gameId } = req.body;

  const [rows] = await pool.query(
    "SELECT filelocation FROM games WHERE game_id=?",
    [gameId]
  );

  const key = rows[0].filelocation;

  try {
    await minioClient.statObject("mybucket", key);

    await pool.query(
      "UPDATE games SET filestatus='uploaded' WHERE game_id=?",
      [gameId]
    );

    res.json({ success: true });

  } catch {
    await pool.query(
      "DELETE FROM dev_games WHERE game_id = ?",
      [gameId]
    );
    res.status(400).json({ error: "Upload not found" });
  }
});

module.exports = router

/* 
const metaData = {
  'x-amz-meta-title': 'My Movie',
  'x-amz-meta-genre': 'Action',
  'x-amz-meta-size': '1024MB'
};

// Generate presigned URL with metadata
const presignedUrl = await minioClient.presignedPutObject(
  'mybucket',
  'movie.mp4',
  24*60*60,
  metaData // pass metadata here
);

1. Once client uploads the data to the minio let it send the metadata to server
2. server checks with const stat = await minioClient.statObject('mybucket', 'movie.mp4');
if the metadata matches and all is fine, we add to the database.
*/
