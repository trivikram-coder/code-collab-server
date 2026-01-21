const roomFiles = {};

const fileEvents = (io, socket) => {

  socket.on("file-create", ({ roomId, file }) => {
    if (!roomId || !file) return;

    // ensure room exists
    if (!roomFiles[roomId]) {
      roomFiles[roomId] = {
        files: [],
      };
    }

    // prevent duplicate file IDs
    const exists = roomFiles[roomId].files.some(
      (f) => f.id === file.id
    );

    if (!exists) {
      roomFiles[roomId].files.push(file);
    }

    console.log("FILES IN ROOM:", roomId, roomFiles[roomId].files);

    // emit ONLY array (frontend expects array)
    io.to(roomId).emit(
      "file-created",
      roomFiles[roomId].files
    );
  });
  socket.on("file-content-update", ({ roomId, fileId, content }) => {
  if (!roomFiles[roomId]) return;

  const file = roomFiles[roomId].files.find(
    (f) => f.id === fileId
  );

  if (!file) return; // 🔥 SAFETY CHECK

  file.content = content;

  io.to(roomId).emit("file-content-updated", {
    fileId,
    content,
  });
});
socket.on("file-delete",({roomId,fileId,userName})=>{
    if(!roomFiles[roomId])return;
    const file=roomFiles[roomId].files.find(file=>file.id===fileId);
    
    if(file.createdBy!==userName){
        socket.emit("delete-error",{msg:"You are not allowed to delete this file"})
        return;
    }
    roomFiles[roomId].files=roomFiles[roomId].files.filter(file=>file.id!==fileId)
    console.log(JSON.stringify(file)+"has been deleted")
    io.to(roomId).emit("file-created",roomFiles[roomId].files)
    
})
};
module.exports={fileEvents,roomFiles}