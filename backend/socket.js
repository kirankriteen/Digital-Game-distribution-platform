const formatMessage = require('./utils/messages')
const { connectDB, mongoose } = require('./db/mongodb')
const { User, Group, Message } = require('./db/models')
const jwt = require("jsonwebtoken");

const botName = "Nebula_Bot"

async function handleConnection(io, socket) {
  console.log('new socket connection ...')


  let user;
  try {
    user = await User.findOne({ user_id: socket.userId });
  } catch (err) {
    console.error('Error fetching user:', err);
  }

  const userName = user ? user.username : 'Unknown User';

  const groupId = socket.groupId;
  socket.userMongoId = user._id;
  socket.join(groupId);

  await Message.updateMany(
    { group: groupId, readBy: { $ne: user._id } },
    { $push: { readBy: user._id } }
  );

  socket.emit('message', formatMessage(botName, 'Welcome to the chat'))
  socket.to(groupId).emit('message', formatMessage(botName, ` ${userName} has joined the chat`))

  socket.on('chatMessage', async (msg) => {
    try {
      io.to(groupId).emit('message', formatMessage(userName, msg));

      const socketsInRoom = await io.in(groupId).fetchSockets();
      const userIdsInRoom = socketsInRoom.map(s => s.userMongoId);

      // Save message to MongoDB
      const newMessage = await Message.create({
        group: groupId,
        sender: user._id,
        text: msg,
        readBy: userIdsInRoom 
      });

      console.log("Message saved:", newMessage._id);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on('disconnect', () => {
    io.to(groupId).emit('message', formatMessage(botName, `${userName} has left the chat`))
  })
}

module.exports = (io) => {
  // Auth Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token
      const groupId = socket.handshake.auth.groupId;

      if (!token) return next(new Error("No token provided"));
      if (!groupId) return next(new Error("No groupId provided"));

      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.userId = payload.id;
      socket.groupId = groupId;
      next()
    } catch (err) {
      console.error("Socket auth error:", err.message);
      next(new Error("Authentication error"));
    }
  }),
    io.on('connection', (socket) => handleConnection(io, socket));
};