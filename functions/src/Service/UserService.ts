import { Repository } from "../Repository/Repository"
import { User } from "../Model/User"
import { JWT } from "../Model/JWT"
import { Environment } from "../Constants/environment"
import { userValidations } from "../Util/validations/userValidations"
import * as bcrypt from "bcrypt"
import * as jwt from "jsonwebtoken"

export const UserService = Object.freeze({

    generateAuthToken: async (username: string, password: string): Promise<string> => {
        let user: User = await Repository.users.read(username)
        if(userValidations.username?.test(username) === false){
            throw new Error("invalid username provided")
        }
        if(userValidations.password?.test(password) === false){
            throw new Error("invalid password provided")
        }

        if(user === undefined){
            user = {
                username,
                password: await bcrypt.hash(password, 10),
                organizations: {},
                creation_date: Date.now()
            }
            await Repository.users.create(user)
        }

        if(await bcrypt.compare(password, user.password) === false){
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

})