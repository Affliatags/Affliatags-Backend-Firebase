export interface UserPermissions {
    tokensPerHour: 6 | 10 | 30 | 60 | null,
    accounts: {
        CREATE: boolean,
        READ: boolean,
        UPDATE: boolean,
        DELETE: boolean,
    }
    allowGenerateTags: boolean,
    allowScanTags: boolean,
}