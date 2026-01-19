const express=require("express")
const router=express().router
const runCode=require("../util/runCode")
router.post("/run",runCode)
module.exports=router