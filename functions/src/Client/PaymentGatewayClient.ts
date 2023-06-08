import { Environment } from "../Constants/environment"
import { PaymentCard } from "../Model/PaymentCard"

export const PaymentGatewayClient = Object.freeze({

    chargeCard: async (card: PaymentCard, charge: number): Promise<void> => {
        await fetch(Environment.getPaymentGatewayUrl(), {
            "method": "POST",
            "body": JSON.stringify({
                card,
                charge,
            })
        })
    }

})