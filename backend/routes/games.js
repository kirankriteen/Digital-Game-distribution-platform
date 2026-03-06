const express = require('express')
const path = require('path')
const { pool } = require('../db/pool')
const { minioClient } = require('../db/minioclient')

const { authenticateToken, setUser } = require('../middleware/auth')

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
