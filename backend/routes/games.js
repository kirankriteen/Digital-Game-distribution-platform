const express = require('express')
const path = require('path')
const multer = require('multer');
const fs = require('fs');
const { pool } = require('../db/pool')
const { minioClient } = require('../db/minioclient')
const Minio = require('minio');
const { ROLE } = require('../data')
// const { authenticateToken, authenticateRole } = require('../middleware/auth')
const { authenticateToken, authenticateRole } = require('../middleware/auth');
const router = express.Router()
router.use(express.json())

const zipStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/zips/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
})

const uploadZip = multer({
  storage: zipStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files allowed'));
    }
  }
})

router.get('/', (req, res) => {
  res.send('Games Page')
})

async function getGenreId(genre) {
  const [genreRows] = await pool.query(
    `SELECT genre_id FROM genre WHERE genre = ?`,
    [genre]
  )
  if (genreRows.length === 0) {
    throw { status: 403, message: 'Not defined genre' };
  }

  return genreRows[0].genre_id;
}

router.post('/upload-url', authenticateToken, authenticateRole([ROLE.DEVELOPER]), async (req, res) => {

  try {
    // Get data from the client
    const { filename, title, genre, price, bio, os, processor, memory, storage } = req.body;
    if (!filename || !title || !genre || !price || !bio || !os || !processor || !memory || !storage) {
      return res.status(400).json({ error: "Missing fields" });
    }
    // insert into the database the data with status not uploaded
    const [devRows] = await pool.query(
      `SELECT dev_id FROM developer WHERE user_id = ?`,
      [req.user.id]
    )
    if (devRows.length === 0) {
      console.log('There is no developer');
      return res.status(400).json({ error: 'There is no developer' })
    }
    const dev_id = devRows[0].dev_id

    const genre_id = await getGenreId(genre);
    const [gameResult] = await pool.query(
      `INSERT INTO games 
       (title, genre_id, filelocation, filestatus, price, bio, os, processor, memory, storage)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, genre_id, `/${title}`, "pending", price, bio, os, processor, memory, storage]
    );
    const gameId = gameResult.insertId;
    const [upload] = await pool.query(
      `INSERT INTO dev_games (dev_id, game_id)
       VALUES (?, ?)`,
      [dev_id, gameId]
    );

    // send the url
    const presignedUrl = await minioClient.presignedPutObject(
      'mybucket',
      title,
      24 * 60 * 60
    );

    res.json({
      uploadUrl: presignedUrl,
      gameId,
      filename,
      title,
      genre,
      bio,
      os,
      processor,
      memory,
      storage
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error generating presigned URL', details: err.message });
  }
})

router.post('/upload-zip', authenticateToken, authenticateRole(ROLE.DEVELOPER), uploadZip.single('zipfile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    const zipPath = req.file.path;
    const extractPath = `uploads/extracted/${Date.now()}`;

    fs.mkdirSync(extractPath, { recursive: true })

    const admZip = require('adm-zip');
    const zip = new admZip(zipPath)
    zip.extractAllTo(extractPath, true);

    fs.unlinkSync(zipPath);

    const files = fs.readdirSync(extractPath);

    console.log('Extracted files:', files);

    const videoFile = files.find(f => f.endsWith('.mp4'));
    const img1File = files.find(f => f.startsWith('img1'));
    const img2File = files.find(f => f.startsWith('img2'));
    const img3File = files.find(f => f.startsWith('img3'));
    const cover = files.find(f => f.startsWith('cover'));

    const videoPath = videoFile ? `/${extractPath}/${videoFile}` : null;
    const img1Path = img1File ? `/${extractPath}/${img1File}` : null;
    const img2Path = img2File ? `/${extractPath}/${img2File}` : null;
    const img3Path = img3File ? `/${extractPath}/${img3File}` : null;
    const coverPath = cover ? `/${extractPath}/${cover}` : null;

    const [devRows] = await pool.query(
      `SELECT dev_id FROM developer WHERE user_id = ?`,
      [req.user.id]
    )
    if (devRows.length === 0) {
      console.log('There is no developer');
      return res.status(400).json({ error: 'There is no developer' })
    }
    const dev_id = devRows[0].dev_id

    const { gameId } = req.body;
    if (!gameId) {
      return res.status(400).json({ error: 'Missing gameId' });
    }

    const [gameExist] = await pool.query(
      `SELECT * FROM games WHERE game_id = ?`,
      [gameId]
    )
    if (gameExist.length === 0) {
      return res.status(404).json({ error: "game not found" })
    }

    await pool.query(
      `UPDATE games 
         SET video = ?, img1 = ?, img2 = ?, img3 = ?, cover = ?
         WHERE game_id = ?`,
      [videoPath, img1Path, img2Path, img3Path, coverPath, gameId]
    );

    res.json({
      success: true,
      extractedPath: extractPath,
      video: videoPath,
      images: [img1Path, img2Path, img3Path],
      cover: coverPath
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'ZIP processing failed' });
  }
})

router.post('/download-url', authenticateToken, authenticateRole([ROLE.USER, ROLE.DEVELOPER]), async (req, res) => {
  try {
    console.log(req.body.filename)
    const filename = req.body.filename
    if (!filename) {
      return res.status(400).send('Filename is required');
    }

    // Get the game id from the games tables
    const [gameRows] = await pool.query(
      `SELECT game_id FROM games WHERE title = ?`,
      [filename]
    )
    if (gameRows.length === 0) {
      console.log('There is no such game')
      return res.status(500).json({ error: 'there is no such game' })
    }
    const game_id = gameRows[0].game_id

    // Check in the db if the user or dev can access the file
    const [developer] = await pool.query(
      `SELECT dev_id FROM developer WHERE user_id = ?`,
      [req.user.id]
    )
    if (developer.length !== 0) {
      const dev_id = developer[0].dev_id;

      const presignedUrl = await minioClient.presignedGetObject(
        'mybucket',
        filename,
        24 * 60 * 60
      )
      console.log('Download URL:', presignedUrl);
      return res.json({ url: presignedUrl });
    }


    const [userGame] = await pool.query(
      `SELECT * FROM user_games WHERE user_id = ? AND game_id = ?`,
      [req.user.id, game_id]
    )
    if (userGame.length === 0) {
      console.log('The user does not own the game')
      return res.status(500).json({ error: 'the user does not own the game' })
    }

    const presignedUrl = await minioClient.presignedGetObject(
      'mybucket',
      filename,
      24 * 60 * 60
    )
    console.log('Download URL:', presignedUrl);
    return res.json({ url: presignedUrl });

  } catch (e) {
    console.log(e.message)
    res.status(500).json({ error: e.message })
  }
})

router.post('/upload-complete', authenticateToken, authenticateRole(ROLE.DEVELOPER), async (req, res) => {
  const { gameId } = req.body;
  console.log(gameId)

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

    await pool.query(
      "INSERT INTO user_games(user_id, game_id) VALUES (?, ?)",
      [req.user.id, gameId]
    )

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
