const Room = require("../models/Room");

// optional in-memory cache (for speed, not required)
const roomFiles = {};

const fileEvents = (io, socket) => {

  // -------------------------
  // FILE CREATE
  // -------------------------
  socket.on("file-create", async ({ roomId,userName, file }) => {

    if (!roomId || !file) return;

    const room = await Room.findOne({ roomId });
    const user=room.users.find(u=>u.userName===userName);
    const isAdminOrEditor=user?.role==="admin"||user?.role==="editor";
    if(!isAdminOrEditor)return;
    if (!room) return;

    // prevent duplicate file id
    const exists = room.files.some(f => f.id === file.id);
    if (exists) return;

    room.files.push(file);
    await room.save();

    // update cache
    roomFiles[roomId] = { files: room.files };

    // emit full file list
    io.to(roomId).emit("file-created", room.files);
  });

  // -------------------------
  // FILE CONTENT UPDATE
  // -------------------------
  socket.on("file-content-update", async ({ roomId,userName, fileId, content }) => {
    if (!roomId || !fileId) return;

    const room = await Room.findOne({ roomId });
    console.log("Content of the file",content)
    if (!room) return;
    const user=room.users.find(u=>u.userName===userName);
    const isAdminOrEditor=user?.role==="admin"||user?.role==="editor";
    if(!isAdminOrEditor)return;
    const file = room.files.find(f => f.id === fileId);
    if (!file) return;

    file.content = content;
    await room.save();

    // update cache
    roomFiles[roomId] = { files: room.files };

    // emit delta update
    io.to(roomId).emit("file-content-updated", {
      fileId,
      content
    });
  });

  // -------------------------
  // FILE DELETE
  // -------------------------
  socket.on("file-delete", async ({ roomId, fileId, userName }) => {
    if (!roomId || !fileId) return;

    const room = await Room.findOne({ roomId });
    if (!room) return;
    const user=room.users.find(u=>u.userName===userName);
    const isAdminOrEditor=user?.role==="admin"||user?.role==="editor";
    if(!isAdminOrEditor)return;
    const file = room.files.find(f => f.id === fileId);
    if (!file) return;

    // permission check
    if (file.createdBy !== userName) {
      socket.emit("delete-error", {
        msg: "You are not allowed to delete this file"
      });
      return;
    }

    room.files = room.files.filter(f => f.id !== fileId);
    await room.save();

    // update cache
    roomFiles[roomId] = { files: room.files };

    // emit updated file list
    io.to(roomId).emit("file-created", room.files);
  });
};

module.exports = { fileEvents, roomFiles };
