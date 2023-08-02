import { Repository } from "../Repository/Repository"
import { User } from "../Model/User"
import { JWT } from "../Model/JWT"
import { Environment } from "../Constants/environment"
import * as bcrypt from "bcrypt"
import * as jwt from "jsonwebtoken"

export const UserService = Object.freeze({

    getUser: async (username: string): Promise<User | undefined> => {
        const user: User | undefined = await Repository.users.read(username)
        return user
    },

    updateUser: async (username: string, profilePhoto: string | null | undefined, password: string | undefined): Promise<void> => {
        const user: User = await Repository.users.read(username)
        user.profilePhoto = profilePhoto === undefined ? user.profilePhoto : profilePhoto
        user.password = password === undefined ? user.password : await bcrypt.hash(password, 10)
        await Repository.users.update(username, user)
    },

    generateAuthToken: async (username: string, password: string): Promise<string> => {
        let user: User = await Repository.users.read(username)

        if(user === undefined){
            user = {
                profilePhoto: null,
                username,
                password: await bcrypt.hash(password, 10),
                organizations: {},
                creationDate: Date.now()
            }
            await Repository.users.create(user)
        }

        if(await bcrypt.compare(password, user.password) !== true){
            throw new Error("invalid credentials")
        }
        const token: JWT = {
            user: username,
            timestamp: Date.now(),
            expiration: null,
        }
        return jwt.sign(token, Environment.getJwtSecretKey())
    },

    verifyAuthToken: (authToken: string): JWT => {
        const decodedToken = jwt.verify(authToken, Environment.getJwtSecretKey())
        return decodedToken as JWT
    },

    checkIfUserExists: async (username: string): Promise<{creationDate: number} | null> => {
        const user: User | undefined = await Repository.users.read(username)
        return user === undefined ? null : {
            creationDate: user.creationDate
        }
    }
})