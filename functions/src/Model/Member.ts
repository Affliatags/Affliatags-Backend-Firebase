import { UserPermissions } from "./UserPermission";

export interface Member {
    username: string
    permissions: UserPermissions
    creationDate: number
    tagDescription: string
    tagExpiration: number | null
    tags: {
        tagCount: number
        tagGenerationLimit: number | null
        totalTagCount: number
        timestamp: number
    }
}