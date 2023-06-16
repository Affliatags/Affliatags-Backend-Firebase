import { Group } from "../../Model/Group"
import { userValidations } from "./userValidations"

let group: Group
export const groupValidations: Record<keyof typeof group, RegExp | undefined | any> = Object.freeze({
    organization: /^[a-z0-9 _]{1,}$/,
    owner: userValidations.username,
    instagram: /^[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/,
    memberCount: /^[0-9]{1,}$/,
    creation_date: /^[0-9]{1,}$/,
    subscription: {
        last_renewal_date: /^[0-9]{1,}$/,
        expiration_date: /^[0-9]{1,}$/,
    },
    tags: {
        tag_count: /^[0-9]{1,}$/,
        timestamp: /^[0-9]{1,}$/,
    },
    instagramVerificationCode: undefined
})