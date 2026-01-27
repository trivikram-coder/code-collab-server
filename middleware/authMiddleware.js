const jwt=require("jsonwebtoken")
require("dotenv").config()
const generateToken=(payload)=>{
    const token=jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:"7d"})
    return token;
}
const verifyToken=(req,res,next)=>{
    const header = req.headers.authorization;

   
    if(!header || !header.startsWith("Bearer ")){
        return res.status(401).json({success:false,message:"Token is missing"})
    }
    const token=header.split(" ")[1]
    try {
        const user=jwt.verify(token,process.env.JWT_SECRET)
        req.user=user;
        next();
    } catch (error) {
    if (error.name === "TokenExpiredError") {
        return res.status(401).json({ success:false,message: "Token expired" });
    }
    return res.status(401).json({ success:false,message: "Unauthorized access" });
    }
}
module.exports={verifyToken,generateToken}