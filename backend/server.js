require('dotenv').config()

express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')
const PORT = 3000
const app = express()
const path = require("path")
const { ROLE, users, projects } = require('./data')
const { authUser, authRole } = require('./roleAuth')
const { authenticateToken, setUser } = require('./middleware/auth')
const projectRouter = require('./routes/projects')
const gamesRouter = require('./routes/games')
const devRouter = require('./routes/developer')

const jwt = require('jsonwebtoken')
app.use(cors({ origin: "http://localhost:3000" }));


// const notAllowedExt = ['.htm', '.html']
// app.use((req, res, next) => {
//   const ext = path.extname(req.path).toLowerCase();
//   if (ext && notAllowedExt.includes(ext)) {
//     return res.status(404).send('Not allowed');
//   }

//   next();
// });
app.use(express.static(path.join(__dirname, "../frontend")))

app.use(express.json())
app.use('/projects', projectRouter)
app.use('/games', gamesRouter)
app.use('/dev', devRouter)

app.get('/', (req, res) => {
    // res.send('Home Page')
    // res.sendFile(path.join(__dirname, "../frontend/pages/signup_login.htm"));
    res.sendFile(path.join(__dirname, "../frontend/base.html"))
})

app.get('/admin', authenticateToken, setUser, authRole(ROLE.ADMIN), (req, res) => {
    res.send('Admin Page')
})

app.listen(PORT, () => {
    console.log(`Server Runnning at http://localhost:${PORT}`)
})