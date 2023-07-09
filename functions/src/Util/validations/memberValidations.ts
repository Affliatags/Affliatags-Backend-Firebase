import { Member } from "../../Model/Member"
import { userValidations } from "./userValidations"

let member: Member
export const memberValidations: Record<keyof typeof member, RegExp | object | any> = Object.freeze({
    username: userValidations.username,
    tagDescription: /^[A-Z0-9a-z ,.]{0,40}$/,
    tagExpiration: /^[0-9]$/,
    permissions: undefined,
    creationDate: /^[0-9]$/,
    tagLimit: /^[0-9]$/,
    tags: {
        tagCount: /^[0-9]$/,
        timestamp: /^[0-9]$/,
    }    
})