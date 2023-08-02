import { logger } from "../Util/logger";
import { routes } from "../Constants/routes"
import { JWT } from "../Model/JWT"
import { UserService } from "../Service/UserService"
import { Application } from "express";
import { GroupService } from "../Service/GroupService";
import * as requestDTO from "../DTO/request"

export const TagController = (app: Application) => {
    app.post(
        routes.generateTag,
        requestDTO.GenerateTagDTO.Validator,
        async (req, res) => {
            try {
                const { headers, params, body } = req as unknown as typeof requestDTO.GenerateTagDTO.DTO
                if (typeof (headers.authorization) !== "string") {
                    throw new Error("unauthorized")
                }
                const jwt: JWT = UserService.verifyAuthToken(headers.authorization.split(" ")[1])
                const organization: string = params.organization
                const description: string = body.description
                const captchaResponse: string | null = body.captchaResponse ?? null
                const expiration: number | null = body.expiration ?? null
                const tag: string = await GroupService.generateTag(jwt.user, organization, description, expiration, captchaResponse)
                res.send({ tag })
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "unauthorized":
                        res.status(401).send(error.message)
                        break
                    case "captcha is required":
                        res.status(400).send(error.message)
                        break
                    case "incorrect captcha provided":
                        res.status(400).send(error.message)
                        break
                    case "group not found":
                        res.status(404).send(error.message)
                        break
                    case "unauthorized to perform this action, cannot update tag description":
                        res.status(400).send(error.message)
                        break
                    default:
                        logger(error.message)
                        res.status(500).send("internal server error")
                        break
                }
            }
        }
    )

    app.post(
        routes.verifyTag, 
        requestDTO.VerifyTagDTO.Validator,
        async (req, res) => {
            try {
                const { headers, params } = req as unknown as typeof requestDTO.VerifyTagDTO.DTO
                if (typeof (headers.authorization) !== "string") {
                    throw new Error("unauthorized")
                }
    
                const jwt: JWT = UserService.verifyAuthToken(headers.authorization.split(" ")[1])
                const tag: string = params.tag
                const organization: string = params.organization
    
                res.send({
                    isValid: await GroupService.verifyTag(jwt.user, organization, tag)
                })
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "unauthorized":
                        res.status(401).send(error.message)
                        break
                    case "group not found":
                        res.status(404).send(error.message)
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