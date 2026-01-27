const mongoose=require("mongoose")
const schema=new mongoose.Schema({
    userName:{
        type:String,
        required:true,

    },
    mobileNumber:{
        type:String,
        required:true,
        unique:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    }


},{timestamps:true})

module.exports=mongoose.model("User",schema)