import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
declare global{
    namespace Express {
        interface Request {
            userId : string
        }
    }
}

interface TokenPayload {
    id : string
}

export const Middleware = (req: Request , res : Response , next : NextFunction) => {
    const token = req.headers["authorization"]
    const decodeInfo = jwt.verify(token as string , JWT_SECRET) as TokenPayload

    if(decodeInfo){
        req.userId = decodeInfo.id
        next()
    }
    else{
        res.status(403).json({
            msg : "Please signin first"
        })
    }
}