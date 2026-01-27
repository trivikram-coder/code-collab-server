const express=require("express")
const {register, login, getUser, updateUser,resetPassword}=require("../controller/authController")
const {verifyToken}=require("../middleware/authMiddleware")
const router=express.Router()
//Register route
router.post("/register",register)
router.post("/login",login)
router.get("/users/me",verifyToken,getUser)
router.put("/users/me/:id",verifyToken,updateUser)
router.put("/users/reset-password/:email",verifyToken,resetPassword)
module.exports=router