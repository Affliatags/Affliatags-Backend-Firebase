import { Member } from "./Member"

export interface Organization {
    organization_name: string
    owner: string
    members: Record<username, Member>
    subscription: {
        last_renewal_date: number | null,
        expiration_date: number | null,
    }
    tags: {
        tag_count: number,
        timestamp: number,
    }
    creation_date: number
} 

type username = string