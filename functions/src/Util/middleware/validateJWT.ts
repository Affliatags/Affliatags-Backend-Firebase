import { routes } from "../../Constants/routes";
import { UserService } from "../../Service/UserService";

export const validateJWT = async (req: any, res: any, next: any) => {
    routes.users
    routes.auth
    routes.deals
    routes.premium
    routes.verifyTagWeb
    const nonSecurePaths = [
        /^\/api\/auth/g,
        /^\/api\/deals/g,
        /^\/api\/organizations\/[a-z0-9 _]{1,}\/premium$/g,
        /^\/api\/tags\/[a-z0-9 _]{1,}\/verifyweb\/[a-z,0-9,-]{1,}$/g,
        /^\/api\/users\/[a-z0-9_]{1,12}$/g,
    ]

    if (nonSecurePaths.filter(val => val.test(req.path)).length !== 0) {
        return next()
    }

    if(typeof(req.headers.authorization) !== "string"){
        res.status(401).send("missing auth token")
        return
    }

    if(req.headers.authorization.indexOf("Bearer") !== 0){
        throw new Error("invalid bearer token provided")
    }

    const authToken: string = req.headers.authorization.split(" ")[1]

    try{
        UserService.verifyAuthToken(authToken)
        next()
    }
    catch(err){
        res.status(401).send("invalid credentials")
    }
}