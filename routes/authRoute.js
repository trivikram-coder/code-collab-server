const express=require("express")
const {register, login, getUser, updateUser,resetPassword, checkEmail}=require("../controller/authController")
const {verifyToken}=require("../middleware/authMiddleware")
const {verifyEmailServiceToken}=require("../middleware/emailMiddleware")
const router=express.Router()
//Register route
router.post("/register",register)
router.post("/login",login)
router.get("/users/me",verifyToken,getUser)
router.put("/users/me/:id",verifyToken,updateUser)
router.put("/users/reset-password",verifyEmailServiceToken,resetPassword)
router.get("/users/check-email/:email",checkEmail)
module.exports=router