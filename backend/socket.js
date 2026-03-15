const formatMessage = require('./utils/messages')

const botName = "Nebula_Bot"

function handleConnection(io, socket) {
    console.log('new socket connection ...')

  socket.emit('message', formatMessage(botName, 'Welcome to the chat'))
  socket.broadcast.emit('message', formatMessage(botName, ` ${socket.id} has joined the chat`))

  socket.on('chatMessage', (msg) => {
    const user = socket.id

    io.emit('message', formatMessage(user, msg))
  })

  socket.on('disconnect', () => {
    io.emit('message', formatMessage(botName, `${socket.id} has left the chat`))
  })
}

module.exports = (io) => {
  io.on('connection', (socket) => handleConnection(io, socket));
};