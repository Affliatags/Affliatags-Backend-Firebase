import * as functions from "firebase-functions";
import * as express from "express"
import { routes } from "./Constants/routes";
import { UserService } from "./Service/UserService";
import { validateJWT } from "./Util/middleware/validateJWT";
import { GroupService } from "./Service/GroupService";
import { Member } from "./Model/Member";
import { UserPermissions } from "./Model/UserPermission";
import { logger } from "./Util/middleware/logger";
import { JWT } from "./Model/JWT";
import { PaymentCard } from "./Model/PaymentCard";
import { Environment } from "./Constants/environment";
import { GroupDTO } from "./DTO/GroupDTO";
import { DealsDTO } from "./DTO/DealsDTO";
import { userValidations } from "./Util/validations/userValidations";
import { groupValidations } from "./Util/validations/groupValidations";
import { ipBlocker } from "./Util/middleware/ipBlocker";
import { memberValidations } from "./Util/validations/memberValidations";
import { MemberService } from "./Service/MemberService";
import { MemberDTO } from "./DTO/MemberDTO";
import { UserDTO } from "./DTO/UserDTO";

const app = express()
app.use(express.json({
    limit: 1000000
}))
app.all("*", ipBlocker)
app.all("*", validateJWT)

app.post(routes.checkClient, async (req, res) => {
    const clientVersion: string = req.body.clientVersion
    if(clientVersion.split(".").join("") < Environment.getMinSupportedClientVersion().split(".").join("")){
        res.status(502).send({
            status: "client is outdated"
        })
        return
    }
    res.status(200).send({
        status: "client is compliant"
    })    
})

app.get(routes.getUser, async (req, res) => {
    try{
        const username: string = req.params.user
        const userInfo = await UserService.getUser(username)
        if(userInfo === undefined){
            res.status(404).send()
            return
        }
        res.status(200).send(
            UserDTO.fromUser(userInfo)
        )
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.put(routes.updateUser, async (req, res) => {
    try {
        if(typeof(req.headers.authorization) !== "string"){
            throw new Error("unauthorized")
        }
        const  jwt: JWT = UserService.verifyAuthToken(req.headers.authorization.split(" ")[1])
        const profilePhoto: string | null | undefined = req.body.profilePhoto
        const password: string | undefined = req.body.password
        await UserService.updateUser(jwt.user, profilePhoto, password)
        res.send()
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send(error.message)
                break
            case "invalid password provided":
                res.status(401).send(error.message)
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break                
        }
    }
})

app.post(routes.auth, async (req, res) => {
    try{
        const username: string = req.body.username
        const password: string = req.body.password
        const token = await UserService.generateAuthToken(username, password)
        res.status(201).send({ token })
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "invalid credentials":
                res.status(401).send(error.message)
                break
            case "invalid username provided":
                res.status(400).send(`invalid username provided. format must match regex: ${userValidations.username}`)
                break
            case "invalid password provided":
                res.status(400).send(`invalid password provided. format must match regex: ${userValidations.password}`)
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.post(routes.generateTag, async (req, res) => {
    try{
        if(typeof(req.headers.authorization) !== "string"){
            throw new Error("unauthorized")
        }
        const  jwt: JWT = UserService.verifyAuthToken(req.headers.authorization.split(" ")[1])
        const organization: string = req.params.organization
        const description: string = req.body.description
        const captchaResponse: string = req.body.captchaResponse
        const expiration: number | null =  req.body.expiration ?? null
        const tag: string = await GroupService.generateTag(jwt.user, organization, description, expiration, captchaResponse)
        res.send({ tag })
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send(error.message)
                break
            case "invalid username provided":
                res.status(400).send(`invalid username provided. format must match regex: ${userValidations.username}`)
                break
            case "group not found":
                res.status(404).send(error.message)
                break
            case "invalid organization name provided":
                res.status(400).send(`invalid organization name provided. format must match regex: ${groupValidations.organization}`)
                break
            case "invalid tag description provided":
                res.status(400).send(`invalid instagram provided. format must match regex: ${memberValidations.tagDescription}`)
                break
            case "invalid expiration provided":
                res.status(400).send(`invalid expiration provided. format must match regex: ${groupValidations.creationDate}`)
                break
            case "unauthorized to perform this action, cannot update tag description":
                res.status(400).send(error.message)
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.post(routes.verifyTag, async (req, res) => {
    try{
        if(typeof(req.headers.authorization) !== "string"){
            throw new Error("unauthorized")
        }

        const  jwt: JWT = UserService.verifyAuthToken(req.headers.authorization.split(" ")[1])
        const tag: string = req.params.tag
        const organization: string = req.params.organization

        res.send({
            isValid: await GroupService.verifyTag(jwt.user, organization, tag)
        })
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send(error.message)
                break
            case "group not found":
                res.status(404).send(error.message)
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        } 
    }
})

// app.post(routes.resetTagRedeemCount, async (req, res) => {
//     try{
//         if(typeof(req.headers.authorization) !== "string" || req.headers.authorization.split(" ").length !== 2){
//             throw new Error("bearer auth token is missing")
//         }        
//         const user: string = (await UserService.verifyAuthToken(req.headers.authorization.split(" ")[1])).user
//         const memberUsername: string = req.params.member
//         const organization: string = req.params.organization
//         await GroupService.resetTagRedeemCount(user, organization, memberUsername)
//         res.status(200).send()
//     }
//     catch(err){
//         const error: Error = err as Error
//         switch(error.message){
//             case "unauthorized":
//                 res.status(401).send(error.message)
//                 break
//             case "invalid member provided":
//                 res.status(400).send(error.message)
//                 break
//         }
//     }
// })

app.post(routes.createGroup, async (req, res) => {
    try{
        if(typeof(req.headers.authorization) !== "string" || req.headers.authorization.split(" ").length !== 2){
            throw new Error("bearer auth token is missing")
        }        
        const username: string = (await UserService.verifyAuthToken(req.headers.authorization.split(" ")[1])).user
        const organization: string = req.body.organization
        const captchaResponse: string = req.body.captchaResponse
        await GroupService.createGroup(username, organization, captchaResponse)
        res.status(201).send()
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send(error.message)
                break
            case "group already exists":
                res.status(400).send(error.message)
                break
            case "invalid username provided":
                res.status(400).send(`invalid username provided. format must match regex: ${userValidations.username}`)
                break
            case "invalid instagram name provided":
                res.status(400).send(`invalid instagram provided. format must match regex: ${groupValidations.instagram}`)
                break
            case "invalid organization name provided":
                res.status(400).send(`invalid organization name provided. format must match regex: ${groupValidations.organization}`)                
                break
            case "captcha is required":
                res.status(400).send(error.message)
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.post(routes.addGroupInstagram, async (req, res) => {
    try{
        if(typeof(req.headers.authorization) !== "string" || req.headers.authorization.split(" ").length !== 2){
            throw new Error("bearer auth token is missing")
        }        
        const username: string = (await UserService.verifyAuthToken(req.headers.authorization.split(" ")[1])).user
        const organization: string = req.params.organization
        const instagram: string = req.body.instagram
        const verificationCode: string | undefined = await GroupService.addGroupInstagram(username, organization, instagram)
        if(verificationCode !== undefined){
            res.status(200).send({  
                verificationCode,
                instructions: "add verification code to instagram page bio and resend this request to verify"
            })
        }
        res.status(201).send()
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send(error.message)
                break
            case "organization already exists":
                res.status(400).send(error.message)
                break
            case "group not found":
                res.status(404).send(error.message)
                break
            case "invalid username provided":
                res.status(400).send(`invalid username provided. format must match regex: ${userValidations.username}`)
                break
            case "invalid instagram name provided":
                res.status(400).send(`invalid instagram provided. format must match regex: ${groupValidations.instagram}`)
                break
            case "invalid organization name provided":
                res.status(400).send(`invalid organization name provided. format must match regex: ${groupValidations.organization}`)                
                break
            case "captcha is required":
                res.status(400).send(error.message)
                break
            case "pending verification code not found on instagram page":
                res.status(400).send(error.message)
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.get(routes.readGroup, async (req, res) => {
    try{
        if(typeof(req.headers.authorization) !== "string" || req.headers.authorization.split(" ").length !== 2){
            throw new Error("bearer auth token is missing")
        }
        const organization: string = req.params.organization
        const username: string = (await UserService.verifyAuthToken(req.headers.authorization.split(" ")[1])).user
        const groupDTO: GroupDTO = await GroupService.readGroup(username, organization)
        res.status(200).send(groupDTO)
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "insufficient permissions":
            case "unauthorized":
                res.status(401).send(error.message)
                break
            case "group not found":
                res.status(404).send(error.message)
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.get(routes.readGroups, async (req, res) => {
    try{
        if(typeof(req.headers.authorization) !== "string"){
            throw new Error("bearer auth token is missing")
        }
        const username: string = (await UserService.verifyAuthToken(req.headers.authorization.split(" ")[1])).user
        const organizations = await GroupService.readGroups(username)
        res.status(200).send(organizations)
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send(error.message)
                break
            case "maximum groups for user reached":
                res.status(400).send(error.message)
                break                
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.post(routes.addMember, async (req, res) => {
    try{
        const organization: string = req.params.organization
        const username: string = req.body.username
        const permissions: UserPermissions = req.body.permissions
        const tagDescription: string = req.body.tagDescription
        const tagExpiration: number | null = req.body.tagExpiration ?? null
        const tagGenerationLimit: number | null = req.body.tagGenerationLimit ?? null

        const member: Member = {
            username,
            permissions,
            tagDescription,
            tagExpiration,
            tags: {
                tagCount: 0,
                redeemCount: 0,
                totalTagCount: 0,
                tagGenerationLimit,
                timestamp: Date.now(),
            },
            creationDate: Date.now(),   
        }
    
        if(typeof(req.headers.authorization) !== "string"){
            throw new Error("unauthorized")
        }
    
        const jwt: JWT = UserService.verifyAuthToken(req.headers.authorization?.split(" ")[1])
        await MemberService.addMember(jwt.user, organization, member)
        res.status(201).send()
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send(error.message)
                break
            case "unable to add more members to this organization":
                res.status(500).send(error.message)
                break
            case "owner's username cannot be a member's username":
                res.status(400).send(error.message)
                break
            case "member is existing user":
                res.status(400).send("unable to set password, member is an existing user. Include 'confirm' key in request body to confirm")
                break
            case "invalid tag description provided":
                res.status(400).send(`invalid tag description provided. format must match regex: ${memberValidations.tagDescription}`)
                break
            case "invalid username provided":
                res.status(400).send(`invalid username provided. format must match regex: ${userValidations.username}`)
                break
            case "invalid organization name provided":
                res.status(400).send(`invalid organization name provided. format must match regex: ${groupValidations.organization}`)
                break             
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.get(routes.readMembers, async (req, res) => {
    try{
        const filter = String(req.query.filter)
        const offset = Number(req.query.offset)
        const limit = Number(req.query.limit)
        const organization: string = req.params.organization
    
        if(typeof(req.headers.authorization) !== "string"){
            throw new Error("unauthorized")
        }        
        const jwt: JWT = UserService.verifyAuthToken(req.headers.authorization?.split(" ")[1])
        const members = await MemberService.readMembers(jwt.user, organization, filter, offset, limit)
        const response: Array<MemberDTO> = []
        for(const member of members){
            const user = await UserService.getUser(member.username)
            if(user === undefined){
                continue
            }
            response.push(MemberDTO.fromMember(user, member))
        }
        res.status(200).send(response)
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){         
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.post(routes.resetTotalTagCount, async (req, res) => {
    try{

    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){         
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.put(routes.updateMember, async (req, res) => {
    try{
        const organization: string = req.params.organization
        const member: string = req.params.member
        const permissions: UserPermissions = req.body.permissions
        const tagDescription: string = req.body.tagDescription
        const tagExpiration: number | null = req.body.tagExpiration ?? null
        const tagGenerationLimit: number | null = req.body.tagGenerationLimit ?? null
        const totalTagCount: number | null = req.body.totalTagCount ?? null
    
        if(typeof(req.headers.authorization) !== "string"){
            throw new Error("unauthorized")
        }        
    
        const jwt: JWT = UserService.verifyAuthToken(req.headers.authorization?.split(" ")[1])
        await MemberService.updateMember(jwt.user, organization, member, permissions, tagDescription, tagExpiration, tagGenerationLimit, totalTagCount)
        res.status(200).send()
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){         
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.delete(routes.deleteMember, async (req, res) => {
    try{
        const username: string = req.params.member
        const organization: string = req.params.organization
        if(typeof(req.headers.authorization) !== "string"){
            throw new Error("unauthorized")
        }        
        const jwt: JWT = UserService.verifyAuthToken(req.headers.authorization?.split(" ")[1])
        await MemberService.deleteMember(jwt.user, organization, username)
        res.status(200).send()
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send(error.message)
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.get(routes.open, async (res, req) => {
    // TODO: Serve PWA
})

Environment.getEnablePremium() && app.post(routes.premium, async (req, res) => {
    try{
        const organization: string = req.params.organization
        const subscriptionDuration: number = req.body.duration
        const paymentCard: PaymentCard = req.body.cardDetails
       
        await GroupService.upgradeToPremium(organization, subscriptionDuration, paymentCard)
        res.send("organization upgraded to premium service")
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send(error.message)
                break
            case "invalid duration selected":
                res.status(400).send("invalid duration selected. valid values are 2628000000 for 1 month, 15770000000 for six months, 31560000000 for 1 year, 63120000000 for 2 years")
                break
            case "payment error":
                res.status(500).send("an error occurred with the payment process")
                break
            case "group not found":
                res.status(404).send(error.message)
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

Environment.getEnablePremium() && app.get(routes.deals, async (req, res) => {
    try{
        const deals: DealsDTO = {
            silver: Environment.getSilverDealCost(),
            gold: Environment.getGoldDealCost(),
            platinum: Environment.getPlatinumDealCost(),
            diamond: Environment.getDiamondDealCost(),
        } 
        res.send(deals)
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

// TODO: API Versioning


app.get(routes.getLatestAppVersion, (req, res) => {
    // TODO: Fetch latest app version from the google play store instead
    res.send({
        version: "1.0.0",
        outdatedExpirationDate: 11322323
    })
})

exports.api = functions.https.onRequest(app)