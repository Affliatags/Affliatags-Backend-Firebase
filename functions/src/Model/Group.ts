export interface Group {
    /**
     * organization : identifies a group
     */
    organization: string
    owner: string
    memberCount: number
    instagram: string | null
    subscription: {
        last_renewal_date: number | null
        expiration_date: number | null
    }
    tags: {
        tag_count: number
        timestamp: number
        expiration: number | null
    }
    creation_date: number
    instagramVerificationCode: {
        code: string
        expires: number
    } | null
} 