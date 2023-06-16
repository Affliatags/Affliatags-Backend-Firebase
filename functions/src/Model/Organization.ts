export interface Organization {
    organization_name: string
    owner: string
    memberCount: number
    instagram: string
    subscription: {
        last_renewal_date: number | null,
        expiration_date: number | null,
    }
    tags: {
        tag_count: number,
        timestamp: number,
        expiration: number,
    }
    creation_date: number
} 