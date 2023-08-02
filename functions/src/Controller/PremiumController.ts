import { logger } from "../Util/logger";
import { routes } from "../Constants/routes"
import { Application } from "express";
import { GroupService } from "../Service/GroupService";
import { PaymentCard } from "../Model/PaymentCard";
import { Environment } from "../Constants/environment";
import * as requestDTO from "../DTO/request"
import * as responseDTO from "../DTO/response"

export const PremiumController = (app: Application) => {
    Environment.getEnablePremium() && app.post(
        routes.premium,
        requestDTO.PremiumDTO.Validator,
        async (req, res) => {
            try {
                const { params, body } = req as unknown as typeof requestDTO.PremiumDTO.DTO
                const organization: string = params.organization
                const subscriptionDuration: number = body.duration
                const paymentCard: PaymentCard = body.cardDetails

                await GroupService.upgradeToPremium(organization, subscriptionDuration, paymentCard)
                res.send("organization upgraded to premium service")
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    case "unauthorized":
                        res.status(401).send(error.message)
                        break
                    case "invalid duration selected":
                        res.status(400).send("invalid duration selected. valid values are 2628000000 for 1 month, 15770000000 for six months, 31560000000 for 1 year, 63120000000 for 2 years")
                        break
                    case "payment error":
                        res.status(500).send("an error occurred with the payment process")
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
    
    Environment.getEnablePremium() && app.get(
        routes.deals,
        async (req, res) => {
            try {
                const deals: responseDTO.DealsDTO = {
                    silver: Environment.getSilverDealCost(),
                    gold: Environment.getGoldDealCost(),
                    platinum: Environment.getPlatinumDealCost(),
                    diamond: Environment.getDiamondDealCost(),
                }
                res.send(deals)
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
}