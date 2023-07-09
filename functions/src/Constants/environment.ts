import * as functions from "firebase-functions";
import * as dotenv from "dotenv"

dotenv.config({
    path:"../.env"
})

export const Environment = Object.freeze({
    getFirebaseServiceAccountKey: (): object => {
        if(process.env.FUNCTIONS_EMULATOR !== "true"){
            return JSON.parse(Buffer.from(functions.config().environment.FIREBASE_TOKEN, "base64").toString('utf-8'))
        }
        return JSON.parse(Buffer.from(process.env.FIREBASE_TOKEN as string, "base64").toString('utf-8'))
    },
    getJwtSecretKey: (): string => {
        const jwtSecretKey = process.env.FUNCTIONS_EMULATOR !== "true" ? functions.config().environment.JWT_SECRET_KEY : process.env.JWT_SECRET_KEY
        if(jwtSecretKey === undefined){
            throw new Error("JWT secret key not defined")
        }
        return jwtSecretKey
    },
    getMaxUnsubscribedTagCountPerHour: (): number => {
        const maxUnsubscribedTagCountPerHour: number = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? Number(functions.config().environment.MAX_UNSUBSCRIBED_ORGANIZATION_TAG_COUNT_PER_HOUR )
            : Number(process.env.MAX_UNSUBSCRIBED_ORGANIZATION_TAG_COUNT_PER_HOUR)
        if(maxUnsubscribedTagCountPerHour === undefined){
            throw new Error("max unsubscribed token count per hour is not defined")
        }
        return maxUnsubscribedTagCountPerHour
    },
    getMinSupportedClientVersion: (): string => {
        const minSupportedClientVersion = process.env.FUNCTIONS_EMULATOR !== "true" ? functions.config().environment.MIN_SUPPORTED_CLIENT_VERSION : process.env.MIN_SUPPORTED_CLIENT_VERSION
        if(minSupportedClientVersion === undefined){
            throw new Error("JWT secret key not defined")
        }
        return minSupportedClientVersion        
    },
    getSilverDealCost: (): number => {
        const dealCost: number = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? Number(functions.config().environment.DEAL_COST_SILVER )
            : Number(process.env.DEAL_COST_SILVER)
        if(dealCost === undefined){
            throw new Error("environment variable 'DEAL_COST_SILVER' is not defined")
        }
        return dealCost
    },
    getGoldDealCost: (): number => {
        const dealCost: number = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? Number(functions.config().environment.DEAL_COST_GOLD )
            : Number(process.env.DEAL_COST_GOLD)
        if(dealCost === undefined){
            throw new Error("environment variable 'DEAL_COST_GOLD' is not defined")
        }
        return dealCost
    },
    getPlatinumDealCost: (): number => {
        const dealCost: number = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? Number(functions.config().environment.DEAL_COST_PLATINUM )
            : Number(process.env.DEAL_COST_PLATINUM)
        if(dealCost === undefined){
            throw new Error("environment variable 'DEAL_COST_PLATINUM' is not defined")
        }
        return dealCost
    },
    getDiamondDealCost: (): number => {
        const dealCost: number = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? Number(functions.config().environment.DEAL_COST_DIAMOND )
            : Number(process.env.DEAL_COST_DIAMOND)
        if(dealCost === undefined){
            throw new Error("environment variable 'DEAL_COST_DIAMOND' is not defined")
        }
        return dealCost
    },
    getPaymentGatewayUrl: (): string => {
        const paymentGatewayUrl: string = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? functions.config().environment.PAYMENT_GATEWAY_URL
            : process.env.PAYMENT_GATEWAY_URL
        if(paymentGatewayUrl === undefined){
            throw new Error("environment variable 'DEAL_COST_DIAMOND' is not defined")
        }
        return paymentGatewayUrl
    },
    getHCaptchaSecret: (): string => {
        const hcaptchaSecret: string = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? functions.config().environment.HCAPTCHA_SECRET
            : process.env.HCAPTCHA_SECRET
        if(hcaptchaSecret === undefined){
            throw new Error("environment variable 'HCAPTCHA_SECRET' is not defined")
        }
        return hcaptchaSecret
    },
    getMaxTagsPerHourUntilCaptchaRequired: (): number => {
        const maxTagsPerHourUntilCaptchaRequired: number = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? Number(functions.config().environment.MAX_TAGS_PER_HOUR_UNTIL_CAPTCHA_REQUIRED)
            : Number(process.env.MAX_TAGS_PER_HOUR_UNTIL_CAPTCHA_REQUIRED)
        if(maxTagsPerHourUntilCaptchaRequired === undefined){
            throw new Error("environment variable 'MAX_TAGS_PER_HOUR_UNTIL_CAPTCHA_REQUIRED' is not defined")
        }
        return maxTagsPerHourUntilCaptchaRequired
    },
    getMaxMembersPerOrganization: (): number => {
        const maxMembersPerOrganization: number = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? Number(functions.config().environment.MAX_MEMBERS_PER_ORGANIZATION)
            : Number(process.env.MAX_MEMBERS_PER_ORGANIZATION)
        if(maxMembersPerOrganization === undefined){
            throw new Error("environment variable 'MAX_MEMBERS_PER_ORGANIZATION' is not defined")
        }
        return maxMembersPerOrganization
    },
    getMaxRequestsPerHour: (): number => {
        const maxRequestsPerHour: number = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? Number(functions.config().environment.MAX_REQUESTS_PER_HOUR)
            : Number(process.env.MAX_REQUESTS_PER_HOUR)
        if(maxRequestsPerHour === undefined){
            throw new Error("environment variable 'MAX_REQUESTS_PER_HOUR' is not defined")
        }
        return maxRequestsPerHour
    },
    getEnableCaptcha: (): boolean => {
        const enableCaptcha: boolean = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? functions.config().environment.ENABLE_CAPTCHA === "true"
            : process.env.ENABLE_CAPTCHA === "true"
        if(enableCaptcha === undefined){
            throw new Error("environment variable 'ENABLE_CAPTCHA' is not defined")
        }
        return enableCaptcha
    },
    getEnablePremium: (): boolean => {
        const enablePremium: boolean = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? functions.config().environment.ENABLE_PREMIUM === "true"
            : process.env.ENABLE_PREMIUM === "true"
        if(enablePremium === undefined){
            throw new Error("environment variable 'ENABLE_PREMIUM' is not defined")
        }
        return enablePremium
    },
    getEnableCardPayment: (): boolean => {
        const enableCardPayment: boolean = process.env.FUNCTIONS_EMULATOR !== "true" 
            ? functions.config().environment.ENABLE_CARD_PAYMENTS === "true"
            : process.env.ENABLE_CARD_PAYMENTS === "true"
        if(enableCardPayment === undefined){
            throw new Error("environment variable 'ENABLE_CARD_PAYMENTS' is not defined")
        }
        return enableCardPayment
    }
})