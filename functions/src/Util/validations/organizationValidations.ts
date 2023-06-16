import { Organization } from "../../Model/Organization"
import { userValidations } from "./userValidations"

let organization: Organization
export const organizationValidations: Record<keyof typeof organization, RegExp | undefined | any> = {
    organization_name: /^[a-z0-9 _]{1,}$/,
    owner: userValidations.username,
    instagram:- /^[\w](?!.*?\.{2})[\w.]{1,28}[\w]$/,
    memberCount: /^[0-9]{1,}$/,
    creation_date: /^[0-9]{1,}$/,
    subscription: {
        last_renewal_date: /^[0-9]{1,}$/,
        expiration_date: /^[0-9]{1,}$/,
    },
    tags: {
        tag_count: /^[0-9]{1,}$/,
        timestamp: /^[0-9]{1,}$/,
    }
}