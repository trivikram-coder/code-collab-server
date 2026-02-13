const Room = require("../models/Room");

module.exports = (io, socket) => {

  /* ------------------------------------ */
  /*            CREATE ROOM               */
  /* ------------------------------------ */
  socket.on("create-room", async ({ roomId, roomName, userName }) => {
    if (!roomId || !userName) return;

    let room = await Room.findOne({ roomId });

    if (!room) {
      room = await Room.create({
        roomId,
        roomName: roomName || "Untitled Room",
        admin: userName,
        users: [{ userName, role: "admin" }],
        files: [],
        chats: []
      });
    }

    socket.userName = userName;
    socket.roomId = roomId;
    socket.join(roomId);

    socket.emit("room-details", {
      userName,
      roomName: room.roomName
    });

    socket.emit("file-created", room.files);
    socket.emit("receive-message", { chats: room.chats });

    io.to(roomId).emit("room-admin", { admin: room.admin });
    io.to(roomId).emit("room-users", room.users);
  });

  /* ------------------------------------ */
  /*              JOIN ROOM               */
  /* ------------------------------------ */
  socket.on("join-room", async ({ roomId, userName }) => {
    if (!roomId || !userName) return;

    const room = await Room.findOne({ roomId });

    if (!room) {
      socket.emit("error-message", { error: "Room does not exist" });
      return;
    }

    socket.userName = userName;
    socket.roomId = roomId;

    const exists = room.users.some(u => u.userName === userName);

    if (!exists) {
      room.users.push({ userName, role: "viewer" });
      await room.save();
    }

    socket.join(roomId);
    socket.broadcast.to(roomId).emit("joined-user",{message:`${userName} joined the room`})
    socket.emit("room-details", {
      userName,
      roomName: room.roomName
    });

    socket.emit("file-created", room.files);
    socket.emit("receive-message", { chats: room.chats });

    io.to(roomId).emit("room-admin", { admin: room.admin });
    io.to(roomId).emit("room-users", room.users);
  });

  /* ------------------------------------ */
  /*            CHANGE ROLE               */
  /* ------------------------------------ */
  socket.on("change-role", async ({ roomId, userName, role }) => {
    const room = await Room.findOne({ roomId });
    if (!room) return;

    if (room.admin !== socket.userName) return;

    const user = room.users.find(u => u.userName === userName);
    if (!user) return;

    user.role = role;
    await room.save();

    io.to(roomId).emit("room-users", room.users);
  });

  /* ------------------------------------ */
  /*              LEAVE ROOM              */
  /* ------------------------------------ */
  socket.on("leave-room", async ({ roomId, userName }) => {
    const room = await Room.findOne({ roomId });
    if (!room) return;

    room.users = room.users.filter(u => u.userName !== userName);

    // 🔥 Auto Transfer Admin if Admin Leaves
    if (room.admin === userName && room.users.length > 0) {
      room.admin = room.users[0].userName;
      room.users[0].role = "admin";
    }

    await room.save();

    socket.leave(roomId);

    io.to(roomId).emit("room-admin", { admin: room.admin });
    io.to(roomId).emit("room-users", room.users);
  });


};
