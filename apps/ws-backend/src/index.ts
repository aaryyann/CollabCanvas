import { WebSocketServer , WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken"
import { JWT_SECRET } from "@repo/backend-common/file";
import {prismaClient} from "@repo/db/client"

const wss = new WebSocketServer({port: 8080})

const userRoomMap = new Map<string, { socket: WebSocket; roomId: number | null }>();

function newUser(token : string) : string | null{
    const decoded = jwt.verify((token as string) , JWT_SECRET )

    if(typeof decoded == "string"){
        return null
    }
    if(!decoded || !(decoded as JwtPayload).id){
        return null
    }

    return decoded.id
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
        return
    }

    
    userRoomMap.set(userId, { socket: ws, roomId: null });

    ws.on('message' , async function message(data){
        let rawData;
        try {
            rawData = JSON.parse(data.toString());
        } catch (e) {
            ws.send(JSON.stringify({ type: "error", msg: "Invalid JSON" }));
            return;
        }
        
        if (rawData.type === "join_room") {
            const roomId = rawData.roomId;

            const current = userRoomMap.get(userId);
            if (current?.roomId) {
                ws.send(JSON.stringify({ type: "left", roomId: current.roomId }));
            }

            // Join 
            userRoomMap.set(userId, { socket: ws, roomId });

            await prismaClient.user.update({
                where: { id: userId },
                data: { currentRoomId: roomId }
            });

            ws.send(JSON.stringify({ type: "joined", roomId }));
        }

        // Leave
        if (rawData.type === "leave_room") {
            const current = userRoomMap.get(userId);
            if (current?.roomId !== null) {
                ws.send(JSON.stringify({ type: "left", roomId: current?.roomId }));


                userRoomMap.set(userId, { socket: ws, roomId: null });

                await prismaClient.user.update({
                    where: { id: userId },
                    data: { currentRoomId: null }
                });
            }else{
                ws.send(JSON.stringify({type: "error", msg: "you are not in any room"}))
            }
        }

        // Chat
        if (rawData.type === "chat") {
            const current = userRoomMap.get(userId);
            const msg = rawData.message;
        
            if (!current?.roomId) {
                ws.send(JSON.stringify({ type: "error", msg: "Join a room first" }));
                return;
            }
        
            await prismaClient.chat.create({
                data: {
                    roomId: current.roomId,
                    userId,
                    message: msg
                }
            });
        
            for (const [uid, userData] of userRoomMap.entries()) {
                if (userData.roomId === current.roomId) {
                    userData.socket.send(JSON.stringify({
                        type: "chat",
                        from: userId,
                        roomId: current.roomId,
                        message: msg
                    }));
                }
            }
        }
    });

    ws.on("close", async () => {

        userRoomMap.delete(userId);

        await prismaClient.user.update({
            where: { id: userId },
            data: { currentRoomId: null }
        });
    });

})