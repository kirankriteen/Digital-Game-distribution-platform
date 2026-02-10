require('dotenv').config()

express = require('express')
const bcrypt = require('bcrypt')
const PORT = 3000
const app = express()
const { ROLE, users, projects } = require('./data')
const { authUser, authRole } = require('./roleAuth')
const { authenticateToken, setUser } = require('./middleware/auth')
const projectRouter = require('./routes/projects')

const jwt = require('jsonwebtoken')

app.use(express.json())
app.use('/projects', projectRouter)

app.get('/', (req, res) => {
    res.send('Home Page')
})

app.get('/admin', authenticateToken, setUser, authRole(ROLE.ADMIN), (req, res) => {
    res.send('Admin Page')
})

app.listen(PORT, () => {
    console.log(`Server Runnning at http://localhost:${PORT}`)
})