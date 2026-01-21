const express=require("express")
const dotenv=require("dotenv")
const {Server}=require("socket.io")
const {createServer}=require("http")
const cors=require("cors")
const app=express();
const server=createServer(app)
const socketIo=require("./socket/socket")

const runCodeRoute=require("./routes/runCodeRoute")
const io=new Server(server,{
    cors:{
        origin:"*"
    }
})
socketIo(io)
dotenv.config();
app.use(express.json())
app.use(cors())
app.use("/",runCodeRoute)
app.get("/",(req,res)=>{
    res.send(`<h3 style=color:blue>Code collab server running successfully</h3>`)
})

const PORT=process.env.PORT 
server.listen(PORT,()=>{
    console.log(`Server running on PORT : ${PORT}`);
})