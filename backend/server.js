require('dotenv').config()

express = require('express')
const bcrypt = require('bcrypt')
const cors = require('cors')
const socketio = require('socket.io')
const path = require("path")
const http = require('http')

const { ROLE, users, projects } = require('./data')
const { authUser, authRole } = require('./roleAuth')
const { authenticateToken, setUser } = require('./middleware/auth')
const projectRouter = require('./routes/projects')
const gamesRouter = require('./routes/games')
const devRouter = require('./routes/developer')
const payRouter = require('./routes/payments')
const myRouter = require('./routes/user')

const PORT = 3000
const app = express()
const server = http.createServer(app);
const io = socketio(server);
require('./socket')(io);

const jwt = require('jsonwebtoken')
// app.use(cors({ origin: "http://localhost:3000" }));
app.use(cors());

app.use('/pay', payRouter)

// app.use(express.json({
//     verify: (req, res, buf) => {
//         if (req.originalUrl.includes('/pay/webhook')) {
//             req.rawBody = buf
//         }
//     }
// }))
app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/projects', projectRouter)
app.use('/games', gamesRouter)
app.use('/dev', devRouter)
app.use('/my', myRouter)


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/base.html"))
})

app.get('/admin', authenticateToken, setUser, authRole(ROLE.ADMIN), (req, res) => {
    res.send('Admin Page')
})

server.listen(PORT, () => {
    console.log(`Server Runnning at http://localhost:${PORT}`)
})




// const notAllowedExt = ['.htm', '.html']
// app.use((req, res, next) => {
//   const ext = path.extname(req.path).toLowerCase();
//   if (ext && notAllowedExt.includes(ext)) {
//     return res.status(404).send('Not allowed');
//   }

//   next();
// });