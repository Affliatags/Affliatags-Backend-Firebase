import { logger } from "../Util/logger";
import { routes } from "../Constants/routes"
import { UserService } from "../Service/UserService"
import { Application } from "express";
import { JWT } from "../Model/JWT";
import * as requestDTO from "../DTO/request"
import * as responseDTO from "../DTO/response"

export const UserController = (app: Application) => {
    app.post(
        routes.auth,
        requestDTO.AuthDTO.Validator,
        async (req, res) => {
            try {
                const { body } = req as unknown as typeof requestDTO.AuthDTO.DTO
                const username: string = body.username
                const password: string = body.password
                const token = await UserService.generateAuthToken(username, password)
                res.status(201).send({ token })
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "invalid credentials":
                        res.status(401).send(error.message)
                        break
                    default:
                        logger(error.message)
                        res.status(500).send("internal server error")
                        break
                }
            }
        }
    )
    
    app.get(
        routes.readUser,
        requestDTO.ReadUserDTO.Validator,
        async (req, res) => {
            try {
                const { params } = req as unknown as typeof requestDTO.ReadUserDTO.DTO
                const username = params.user
                const userInfo = await UserService.getUser(username)
                if (userInfo === undefined) {
                    res.status(404).send()
                    return
                }
                res.status(200).send(
                    responseDTO.UserDTO.fromUser(userInfo)
                )
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    default:
                        logger(error.message)
                        res.status(500).send("internal server error")
                        break
                }
            }
        }
    )
    
    app.put(
        routes.updateUser,
        requestDTO.UpdateUserDTO.Validator,
        async (req, res) => {
            try {
                const { headers, body } = req as unknown as typeof requestDTO.UpdateUserDTO.DTO
                if (typeof (headers.authorization) !== "string") {
                    throw new Error("unauthorized")
                }
                const jwt: JWT = UserService.verifyAuthToken(headers.authorization.split(" ")[1])
    
                const profilePhoto = body.profilePhoto
                const password = body.password
                await UserService.updateUser(jwt.user, profilePhoto, password)
                res.send()
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "unauthorized":
                        res.status(401).send(error.message)
                        break
                    case "invalid password provided":
                        res.status(401).send(error.message)
                        break
                    default:
                        logger(error.message)
                        res.status(500).send("internal server error")
                        break
                }
            }
        }
    )
}