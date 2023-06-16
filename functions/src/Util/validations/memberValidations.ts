import { Member } from "../../Model/Member"
import { organizationValidations } from "./organizationValidations"
import { userValidations } from "./userValidations"

let member: Member
export const memberValidations: Record<keyof typeof member, RegExp | object | any> = {
    username: userValidations.username,
    organization: organizationValidations.organization_name,
    tag_description: /^[A-Z0-9a-z ,.]{0,40}$/,
    permissions: undefined,
    creation_date: /^[0-9]$/,
    tags: {
        tag_count: /^[0-9]$/,
        timestamp: /^[0-9]$/,
    }    
}