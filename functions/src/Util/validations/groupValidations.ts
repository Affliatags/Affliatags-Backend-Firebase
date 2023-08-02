import { Group } from "../../Model/Group"
import { userValidations } from "./userValidations"

let group: Group
export const groupValidations: Record<keyof typeof group, RegExp | undefined | any> = Object.freeze({
    organization: /^[a-z0-9 _]{1,60}$/,
    owner: userValidations.username,
    instagram: /^[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/,
    memberCount: /^[0-9]{1,}$/,
    creationDate: /^[0-9]{1,}$/,
    subscription: {
        lastRenewalDate: /^[0-9]{1,}$/,
        expirationDate: /^[0-9]{1,}$/,
    },
    tags: {
        tagCount: /^[0-9]{1,}$/,
        timestamp: /^[0-9]{1,}$/,
    },
    instagramVerificationCode: undefined,
    logo: /^$/
})