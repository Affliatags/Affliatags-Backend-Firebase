import { UserPermissions } from "./UserPermission";

export interface Member {
    username: string,
    organization: string,
    permissions: UserPermissions,
    creation_date: number,
    tags: {
        tag_count: number,
        timestamp: number,
    }
}