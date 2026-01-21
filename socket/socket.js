const roomEvents=require("./room.events")
const chatEvents=require("./chat.events")
const {socketFun}=require("./editor.events")
const {fileEvents}=require("./file.events")
module.exports=(io)=>{
    io.on("connection",(socket)=>{
        console.log("User connected with socket Id : ",socket.id);
        roomEvents(io,socket)
        chatEvents(io,socket)
        socketFun(io,socket)
        fileEvents(io,socket)
    })
}