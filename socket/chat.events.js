// socket/chat.events.js
const Room = require("../models/Room");

module.exports = (io, socket) => {

  socket.on("send-message", async ({ roomId, userName, message }) => {
    if (!roomId || !userName || !message) return;

    const room = await Room.findOne({ roomId });
    if (!room) return;

    room.chats.push({
      message,
      user: userName
    });

    await room.save();

    // 🔥 realtime broadcast (DB is source of truth)
    io.to(roomId).emit("receive-message", {
      chats: room.chats,
      time: new Date().toLocaleString()
    });
  });
  socket.on("get-messages",async({roomId})=>{
    console.log("Event emitted")
    if(!roomId)return;
    const room=await Room.findOne({roomId})
    if(!room)return;
    io.to(roomId).emit("receive-message",{
      chats:room.chats,
      time:new Date().toLocaleString()
    })
  })
};
