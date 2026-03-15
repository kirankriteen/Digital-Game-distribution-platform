require('dotenv').config()

express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')
const PORT = 3000
const app = express()
const { ROLE, users, projects } = require('./data')
const { authUser, authRole } = require('./roleAuth')
const { authenticateToken, setUser } = require('./middleware/auth')
const projectRouter = require('./routes/projects')
const gamesRouter = require('./routes/games')
const devRouter = require('./routes/developer')

const jwt = require('jsonwebtoken')
app.use(cors({ origin: "http://127.0.0.1:5501" }));

app.use(express.json())
app.use('/projects', projectRouter)
app.use('/games', gamesRouter)
app.use('/dev', devRouter)

app.get('/', (req, res) => {
    res.send('Home Page')
})

app.get('/admin', authenticateToken, setUser, authRole(ROLE.ADMIN), (req, res) => {
    res.send('Admin Page')
})

app.listen(PORT, () => {
    console.log(`Server Runnning at http://localhost:${PORT}`)
})