import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/file";

const wss = new WebSocketServer({port: 8080})

function newUser(token : string) : string | null{
    const decoded = jwt.verify((token as string) , JWT_SECRET )

    if(typeof decoded == "string"){
        return null
    }
    if(!decoded || !(decoded as JwtPayload).userId){
        return null
    }

    return decoded.userId
}


wss.on('connection' , function connection(ws , req){
    const url = req.url
    if(!url){
        return
    }

    const queryParams = new URLSearchParams (url.split('?')[1])
    const token = queryParams.get('token')

    const  userId = newUser(token as string)

    if(!userId){
        ws.close()
    }

    

    ws.on('message' , function message(data){
        ws.send("pong")
    })

})