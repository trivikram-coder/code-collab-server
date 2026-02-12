const Room = require("../models/Room");

const users = {}; // { roomId: { userName: [socketId] } }

module.exports = (io, socket) => {

  // -------------------------
  // JOIN ROOM
  // -------------------------
  socket.on("join-room", async ({ roomId, roomName, userName }) => {
    if (!roomId || !userName) return;
    
    let room = await Room.findOne({ roomId });

    // 🔹 Create room if not exists
    if (!room) {
      socket.userName=userName;
      room = await Room.create({
        roomId,
        roomName: roomName || "Untitled Room",
        admin: userName,
        users: [{ userName,role:"admin" }],
        files: [],
        chats: []
      });
    } else {
      // 🔹 Add user if not already present
      const exists = room.users.some(u => u.userName === userName);
      if (!exists) {
        room.users.push({ userName });
        await room.save();
      }
    }

    // ---------------- SOCKET JOIN ----------------
    socket.join(roomId);

    // ---------------- MEMORY USERS ----------------
    if (!users[roomId]) users[roomId] = {};
    if (!users[roomId][userName]) users[roomId][userName] = [];

    if (!users[roomId][userName].includes(socket.id)) {
      users[roomId][userName].push(socket.id);
    }
    socket.emit("room-details",{userName:userName,roomName:room.roomName})
    // ---------------- SEND DATA TO CLIENT ----------------
    socket.emit("file-created", room.files);
    socket.emit("receive-message", { chats: room.chats });
 
    io.to(roomId).emit("room-admin",{admin:room.admin})
    // broadcast active users
    io.to(roomId).emit("room-users", room.users);
  });
  socket.on("change-role",async({admin,roomId,userName,role})=>{
    console.log(`${admin}${roomId} ${userName} ${role}`)
    
    const room=await Room.findOne({roomId:roomId});
    
    if(!room){
      socket.emit("error-message",{error:"Room doesnot exists"});
      return ;
    }
    if(room.admin!==admin)return;
  
    const user=room.users.find(u=>u.userName===userName);
    if(!user)return;
    user.role=role
    await room.save();
    console.log("Updated role",room)
    io.to(roomId).emit("room-users", room.users);
  })
  // -------------------------
  // LEAVE ROOM
  // -------------------------
  socket.on("leave-room", ({ roomId, userName }) => {
    if (!users[roomId]?.[userName]) return;

    users[roomId][userName] =
      users[roomId][userName].filter(id => id !== socket.id);

    if (users[roomId][userName].length === 0) {
      delete users[roomId][userName];
    }

    socket.leave(roomId);
    io.to(roomId).emit("room-users", Object.keys(users[roomId]));
  });

  // -------------------------
  // DISCONNECT
  // -------------------------
  socket.on("disconnect", () => {
    for (const roomId in users) {
      for (const userName in users[roomId]) {
        users[roomId][userName] =
          users[roomId][userName].filter(id => id !== socket.id);

        if (users[roomId][userName].length === 0) {
          delete users[roomId][userName];
        }
      }
      io.to(roomId).emit("room-users", Object.keys(users[roomId]));
    }
  });
};
