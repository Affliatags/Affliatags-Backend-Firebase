import { User } from "../../Model/User"

let user: User
export const userValidations: Record<keyof typeof user, RegExp | undefined> = Object.freeze({
    profilePhoto: /^/,
    username: /^[a-z0-9_]{1,12}$/,
    password: /^(?=.*[A-Za-z ])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?& ]{8,}$/,
    organizations: undefined,
    creationDate: /^[0-9]$/,
})