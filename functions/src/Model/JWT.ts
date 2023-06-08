export interface JWT {
    user: string
    timestamp: number
    expiration: number | null
}