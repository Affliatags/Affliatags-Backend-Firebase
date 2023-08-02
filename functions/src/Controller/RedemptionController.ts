import { logger } from "../Util/logger";
import { routes } from "../Constants/routes"
import { JWT } from "../Model/JWT"
import { UserService } from "../Service/UserService"
import { Application } from "express";
import { RedemptionService } from "../Service/RedemptionService";
import { Redemption } from "../Model/Redemption";
import * as requestDTO from "../DTO/request"
import * as responseDTO from "../DTO/response"

export const RedemptionController = (app: Application) => {
    app.post(
        routes.readRedemptions,
        requestDTO.ReadRedemptionsDTO.Validator,
        async (req, res) => {
            try {
                const { headers, params, body, query } = req as unknown as typeof requestDTO.ReadRedemptionsDTO.DTO
                if (typeof (headers.authorization) !== "string") {
                    throw new Error("unauthorized")
                }
                const jwt: JWT = UserService.verifyAuthToken(headers.authorization?.split(" ")[1])
                const organization = params.organization
                const monthsAgo = body.monthsAgo
                const year = body.monthsAgo
                const filter = query.filter
                const offset = query.offset
                const limit = query.limit
                const redemptions: Array<Redemption> = await RedemptionService.getRedemptionsForGroup(jwt.user, organization, monthsAgo, year, filter, offset, limit)
                const redemptionsCount = await RedemptionService.getTotalRedemptionCount(organization, monthsAgo, year)
                const response: responseDTO.RedemptionDTO = {
                    redemptions,
                    totalRedemptions: redemptionsCount
                }
                res.send(response)
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "unauthorized":
                        res.status(401).send(error.message)
                        break
                    case "only redemptions for up to three months ago are provided":
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