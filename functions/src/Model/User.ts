export interface User {
    profilePhoto: string | null,
    username: string,
    password: string,
    organizations: Record<string, number>,
    creationDate: number,
}