import { Organization } from "../Model/Organization"
// import { Subscription } from "./Subscription"
import { User } from "../Model/User"

export const DatabaseSchema = Object.freeze({
    "users": {
        key: "users",
        value: {
            user1:{
                data: <User>{}
            }
        }
    },
    "organizations": {
        key: "organizations",
        value: <Record<organizationName, Organization>>{}
    },
    // "subscriptions": {
    //     key: "subscriptions",
    //     value: <Record<organizationName, Subscription>>{}
    // },
})

// type username = string
type organizationName = string
 