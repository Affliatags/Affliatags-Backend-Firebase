import { UserPermissions } from "./UserPermission";

export interface Member {
    username: string,
    organization: string,
    permissions: UserPermissions,
    creation_date: number,
    tag_description: string,
    tags: {
        tag_count: number,
        timestamp: number,
    }
}