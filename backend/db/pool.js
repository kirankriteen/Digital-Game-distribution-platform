const mysql = require('mysql2')
require('dotenv').config()

// const pool = mysql.createPool({
//     host: process.env.DATABASE_HOST,
//     user: process.env.DATABASE_USER,
//     password: process.env.DATABASE_PASSWORD,
//     database: process.env.DATABASE_DB
// }).promise()

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'VJKsam#2406',
    database: 'game_distribution'
}).promise()


module.exports = { pool }