import { z } from "zod"

export const UserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(5).max(8)
})

export const SigninSchema = z.object({
    email: z.string().email(),
    password: z.string().min(5).max(8)
})


export const RoomSchema = z.object({
    roomId : z.string().min(5).max(20)
})