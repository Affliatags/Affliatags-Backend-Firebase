export interface Group {
    logo: string | null
    organization: string
    owner: string
    memberCount: number
    instagram: string | null
    subscription: {
        lastRenewalDate: number | null
        expirationDate: number | null
    }
    tags: {
        tagCount: number
        timestamp: number
    }
    creationDate: number
    instagramVerificationCode: {
        code: string
        expires: number
    } | null
} 