import { logger } from "../Util/logger";
import { routes } from "../Constants/routes"
import { JWT } from "../Model/JWT"
import { UserService } from "../Service/UserService"
import { Application } from "express";
import { UserPermissions } from "../Model/UserPermission";
import { Member } from "../Model/Member";
import { MemberService } from "../Service/MemberService";
import { RedemptionService } from "../Service/RedemptionService";
import * as requestDTO from "../DTO/request"
import * as responseDTO from "../DTO/response"

export const MemberController = (app: Application) => {
    app.post(
        routes.addMember,
        requestDTO.AddMemberDTO.Validator,
        async (req, res) => {
            try {
                const { params, body, headers } = req as unknown as typeof requestDTO.AddMemberDTO.DTO
                if (typeof (headers.authorization) !== "string") {
                    throw new Error("unauthorized")
                }
                const jwt: JWT = UserService.verifyAuthToken(headers.authorization?.split(" ")[1])

                const organization: string = params.organization
                const username: string = body.username
                const permissions: UserPermissions = body.permissions ?? {
                    accounts: {
                        CREATE: false,
                        READ: false,
                        UPDATE: false,
                        DELETE: false,
                    },
                    allowGenerateTags: true,
                    allowScanTags: false,
                    tagsPerHour: null
                }
                const tagDescription: string = body.tagDescription
                const tagExpiration: number | null = body.tagExpiration ?? null
                const tagGenerationLimit: number | null = body.tagGenerationLimit ?? null

                const member: Member = {
                    username,
                    permissions,
                    tagDescription,
                    tagExpiration,
                    tags: {
                        tagCount: 0,
                        totalTagCount: 0,
                        tagGenerationLimit,
                        timestamp: Date.now(),
                    },
                    creationDate: Date.now(),
                }
                await MemberService.addMember(jwt.user, organization, member)
                res.status(201).send()
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "unauthorized":
                        res.status(401).send(error.message)
                        break
                    case "unable to add more members to this organization":
                        res.status(500).send(error.message)
                        break
                    case "owner's username cannot be a member's username":
                        res.status(400).send(error.message)
                        break
                    case "member is existing user":
                        res.status(400).send("unable to set password, member is an existing user. Include 'confirm' key in request body to confirm")
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
        routes.readMembers,
        requestDTO.ReadMembersDTO.Validator,
        async (req, res) => {
            try {
                const { headers, query, params } = req as unknown as typeof requestDTO.ReadMembersDTO.DTO
                if (typeof (headers.authorization) !== "string") {
                    throw new Error("unauthorized")
                }
                const jwt: JWT = UserService.verifyAuthToken(headers.authorization?.split(" ")[1])
                
                const filter = String(query.filter)
                const offset = Number(query.offset)
                const limit = Number(query.limit)
                const organization: string = params.organization
                const members = await MemberService.readMembers(jwt.user, organization, filter, offset, limit)
                const response: Array<responseDTO.MemberDTO> = []
                for (const member of members) {
                    const user = await UserService.getUser(member.username)
                    if (user === undefined) {
                        continue
                    }
                    response.push(responseDTO.MemberDTO.fromMember(user, member, await RedemptionService.readRedemptionForUser(jwt.user, organization, 0)))
                }
                res.status(200).send(response)
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "unauthorized":
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

    app.put(
        routes.updateMember,
        requestDTO.UpdateMemberDTO.Validator,
        async (req, res) => {
            try {
                const { headers, body, params } = req as unknown as typeof requestDTO.UpdateMemberDTO.DTO
                if (typeof (headers.authorization) !== "string") {
                    throw new Error("unauthorized")
                }

                const jwt: JWT = UserService.verifyAuthToken(headers.authorization?.split(" ")[1])

                const organization: string = params.organization
                const member: string = params.member
                const permissions: UserPermissions = body.permissions
                const tagDescription: string = body.tagDescription
                const tagExpiration: number | null = body.tagExpiration ?? null
                const tagGenerationLimit: number | null = body.tagGenerationLimit ?? null

                await MemberService.updateMember(jwt.user, organization, member, permissions, tagDescription, tagExpiration, tagGenerationLimit)
                res.status(200).send()
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

    app.delete(
        routes.deleteMember,
        requestDTO.DeleteMemberDTO.Validator,
        async (req, res) => {
            try {
                const { headers, params } = req as unknown as typeof requestDTO.DeleteMemberDTO.DTO
                const username: string = params.member
                const organization: string = params.organization
                if (typeof (headers.authorization) !== "string") {
                    throw new Error("unauthorized")
                }
                const jwt: JWT = UserService.verifyAuthToken(headers.authorization?.split(" ")[1])
                await MemberService.deleteMember(jwt.user, organization, username)
                res.status(200).send()
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "unauthorized":
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