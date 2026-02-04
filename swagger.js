const swaggerAutoGen=require("swagger-autogen")
require("dotenv").config()
const doc={
    info:{
        name:"Code Collab Server",
        description:'API Docs for the code collab server'
    },
    host:`localhost:${process.env.PORT}`,
    schemes:["http"]
}
const outputFile="./swagger-output.json"
const routes=["./server.js"]
swaggerAutoGen(outputFile,routes,doc)