const express=require("express")
const Room=require("../models/Room")
const router=express.Router()
router.post("/add",async(req,res)=>{
    try {
        const room=new Room(req.body);
        await room.save()
        res.status(201).json({message:"Room created"})
    } catch (error) {
        res.status(500).json({error:error})
    }
})
module.exports=router