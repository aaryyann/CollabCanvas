import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/file";

const wss = new WebSocketServer({port: 8080})

function newUser(){
    
}


wss.on('connection' , function connection(ws , req){
    const url = req.url
    if(!url){
        return
    }

    const queryParams = new URLSearchParams (url.split('?')[1])
    const token = queryParams.get('token')

    const decoded = jwt.verify((token as string) , JWT_SECRET )

    if(!decoded || !(decoded as JwtPayload).userId){
        ws.close()
        return
    }
    ws.on('message' , function message(data){
        ws.send("pong")
    })

})