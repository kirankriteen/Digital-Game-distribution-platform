require('dotenv').config()

express = require('express')
const bcrypt = require('bcrypt')
const PORT = 3000
const app = express()
const { ROLE, users, userData } = require('./data')

app.use(express.json())

app.get('/', (req, res) => {
    res.send('Home Page')
})

app.post('/login', async (req, res) => {
    const user = userData.find(user => user.username === req.body.username)
    if(!user) {
        return res.status(400).send('Cannot find user')
    }
    try {
        if(await bcrypt.compare(req.body.password, user.password)) {
            res.send('success')
        } else {
            res.send('not allowed')
        }
    } catch {
        res.status(500).send()
    }
})

app.listen(PORT, () => {
    console.log(`Server Runnning at http://localhost:${PORT}`)
})
