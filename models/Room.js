const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomId: {
    type: String,
    unique: true,
    required: true
  },

  roomName: {
    type: String,
    required: true
  },

  admin: {
    type: String,
    required: true
  },

  users: [
    {
      userName: String,
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  files:[
    {
      id:String,
      name:String,
    language:String,
    content:String,
    createdBy:String
    }
  ],
    chats:[
      {
        message:String,
        user:String
      }
    
  ]

 

}, { timestamps: true }); // 👈 createdAt & updatedAt auto

module.exports = mongoose.model("Room", roomSchema);
