import { Application } from "express";
import { logger } from "../Util/logger";
import { routes } from "../Constants/routes"
import { JWT } from "../Model/JWT"
import { UserService } from "../Service/UserService"
import { GroupService } from "../Service/GroupService";
import * as requestDTO from "../DTO/request"
import * as responseDTO from "../DTO/response"

export const GroupController = (app: Application) => {
    app.post(
        routes.createGroup,
        requestDTO.CreateGroupDTO.Validator,
        async (req, res) => {
            try {
                const { headers, body } = req as unknown as typeof requestDTO.CreateGroupDTO.DTO
                if (typeof (headers.authorization) !== "string" || headers.authorization.split(" ").length !== 2) {
                    throw new Error("bearer auth token is missing")
                }
                const username: string = (await UserService.verifyAuthToken(headers.authorization.split(" ")[1])).user
                const organization: string = body.organization
                const captchaResponse: string | null = body.captchaResponse ?? null
                await GroupService.createGroup(username, organization, captchaResponse)
                res.status(201).send()
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "unauthorized":
                        res.status(401).send(error.message)
                        break
                    case "group already exists":
                        res.status(400).send(error.message)
                        break
                    case "captcha is required":
                        res.status(400).send(error.message)
                        break
                    case "incorrect captcha provided":
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
    
    app.delete(
        routes.deleteGroup,
        requestDTO.DeleteGroupDTO.Validator,
        async (req, res) => {
            try {
                const { headers, params } = req as unknown as typeof requestDTO.DeleteGroupDTO.DTO
                if (typeof (headers.authorization) !== "string" || headers.authorization.split(" ").length !== 2) {
                    throw new Error("bearer auth token is missing")
                }
                const ownerUsername: string = (await UserService.verifyAuthToken(headers.authorization.split(" ")[1])).user
                const group = String(params.organization)
                await GroupService.deleteGroup(ownerUsername, group)
                res.status(200).send()
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
    
    app.put(
        routes.addGroupInstagram,
        requestDTO.AddGroupInstagramDTO.Validator,
        async (req, res) => {
            try {
                const { headers, body, params } = req as unknown as typeof requestDTO.AddGroupInstagramDTO.DTO
                if (typeof (headers.authorization) !== "string" || headers.authorization.split(" ").length !== 2) {
                    throw new Error("bearer auth token is missing")
                }
                const username: string = (await UserService.verifyAuthToken(headers.authorization.split(" ")[1])).user
                const organization: string = params.organization
                const instagram: string = body.instagram
                const verificationCode: string | undefined = await GroupService.addGroupInstagram(username, organization, instagram)
                if (verificationCode !== undefined) {
                    res.status(200).send({
                        verificationCode,
                        instructions: "add verification code to instagram page bio and resend this request to verify"
                    })
                }
                res.status(201).send()
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "unauthorized":
                        res.status(401).send(error.message)
                        break
                    case "group already exists":
                        res.status(400).send(error.message)
                        break
                    case "group not found":
                        res.status(404).send(error.message)
                        break
                    case "captcha is required":
                        res.status(400).send(error.message)
                        break
                    case "pending verification code not found on instagram page":
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
    
    app.put(
        routes.updateGroupLogo,
        requestDTO.UpdateGroupLogoDTO.Validator,
        async (req, res) => {
            try {
                const { headers, body, params } = req as unknown as typeof requestDTO.UpdateGroupLogoDTO.DTO
                if (typeof (headers.authorization) !== "string" || headers.authorization.split(" ").length !== 2) {
                    throw new Error("bearer auth token is missing")
                }
                const jwt: JWT = UserService.verifyAuthToken(headers.authorization?.split(" ")[1])
                const organization = params.organization
                const logo = body.logo

                await GroupService.updateGroupLogo(jwt.user, organization, logo)
                res.status(200).send()
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

    app.get(
        routes.readGroup,
        requestDTO.ReadGroupDTO.Validator,
        async (req, res) => {
            try {
                const { headers, params } = req as unknown as typeof requestDTO.ReadGroupDTO.DTO
                if (typeof (headers.authorization) !== "string" || headers.authorization.split(" ").length !== 2) {
                    throw new Error("bearer auth token is missing")
                }
                const organization: string = params.organization
                const username: string = (await UserService.verifyAuthToken(headers.authorization.split(" ")[1])).user
                const groupDTO: responseDTO.GroupDTO = await GroupService.readGroup(username, organization)
                res.status(200).send(groupDTO)
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "insufficient permissions":
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
    
    app.get(
        routes.readGroups,
        requestDTO.ReadGroupsDTO.Validator,
        async (req, res) => {
            try {
                const { headers } = req as unknown as typeof requestDTO.ReadGroupDTO.DTO
                if (typeof (headers.authorization) !== "string") {
                    throw new Error("bearer auth token is missing")
                }
                const username: string = (await UserService.verifyAuthToken(headers.authorization.split(" ")[1])).user
                const organizations = await GroupService.readGroups(username)
                res.status(200).send(organizations)
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "unauthorized":
                        res.status(401).send(error.message)
                        break
                    case "maximum groups for user reached":
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
}