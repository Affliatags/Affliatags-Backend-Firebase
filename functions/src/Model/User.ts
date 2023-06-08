export interface User {
    username: string,
    password: string,
    organizations: Record<string, number>,
    creation_date: number,
}