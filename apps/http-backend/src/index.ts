import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/file";
import { RoomSchema, SigninSchema, UserSchema } from "@repo/common/types";
import { Middleware } from "./middleware";
import { prismaClient } from "@repo/db/client"


const app = express()
const PORT = 3001
app.use(express.json())


console.log(JWT_SECRET)

app.post('/api/v1/signup', async function (req, res) {

    const validUser = UserSchema.safeParse(req.body)

    if(!validUser.success){
        res.json({
            msg : "Incorrect format"
        })
        return
    }

    let exist = false
    try{
        const hashPassword = await bcrypt.hash(validUser.data.password, 5);
        
        await prismaClient.user.create({
            data:{
                name : validUser.data.name,
                email : validUser.data.email ,
                password : hashPassword
            }
        }) 
    }
    catch(e){
        res.json({
            msg : "User already exist"
        })

        exist = true

    }

    if(!exist){
        res.json({
            msg : "User created succesfully"
        })
    }
})

app.post('/api/v1/signin', async function (req, res) {

    const user = SigninSchema.safeParse(req.body)

    if(!user.success){
        res.json({
            msg : "Incorrect format"
        })
        return
    }


    const existingUser = await prismaClient.user.findFirst({
        where : {
            email : user.data.email
        }
    })

    if(!existingUser){
        res.status(411).json({
            msg : "Please sign up first"
        })
        return
    }
    else{
        const matchPassword = await bcrypt.compare(user.data.password, existingUser.password);

        if(matchPassword){
            const token = jwt.sign({
                id : existingUser.id
            },JWT_SECRET)
            res.json({
                token : token
            })
        }
        else{
            res.status(403).json({
                msg : "Incorrect credential"
            })
        }


    }
})

app.post('/api/v1/room', Middleware ,  async function (req, res) {

    const roomData = RoomSchema.safeParse(req.body)
    
    if(!roomData.success){
        res.json({
            message : "Incorrect input"
        })
        return
    }
    const userId = req.userId

    try{
        const room = await prismaClient.room.create({
            data : {
                slug : roomData.data.roomId,
                adminId : userId
            }
        })
        res.json({
            roomId : room.id
        })
    }
    catch(e){
        res.status(403).json({
            msg : "Room already exist"
        })
    }
})


app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`)
})