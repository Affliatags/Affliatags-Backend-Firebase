import * as functions from "firebase-functions";
import * as express from "express"
import { routes } from "./Constants/routes";
import { UserService } from "./Service/UserService";
import { validateJWT } from "./Util/middleware/validateJWT";
import { OrganizationService } from "./Service/OrganizationService";
import { Member } from "./Model/Member";
import { UserPermissions } from "./Model/UserPermission";
import { logger } from "./Util/middleware/logger";
import { JWT } from "./Model/JWT";
import { PaymentCard } from "./Model/PaymentCard";
import { Environment } from "./Constants/environment";
import { Organization } from "./Model/Organization";
import { OrganizationDTO } from "./DTO/OrganizationDTO";
import { DealsDTO } from "./DTO/DealsDTO";
import { userValidations } from "./Util/validations/userValidations";
import { organizationValidations } from "./Util/validations/organizationValidations";
import { ipBlocker } from "./Util/middleware/ipBlocker";

const app = express()
app.use(express.json({
    limit: 1000000
}))
app.all("*", ipBlocker)
app.all("*", validateJWT)

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

app.get(routes.generateTag, async (req, res) => {
    try{
        if(typeof(req.headers.authorization) !== "string"){
            throw new Error("unauthorized")
        }
        const  jwt: JWT = UserService.verifyAuthToken(req.headers.authorization.split(" ")[1])
        const organizationName: string = req.params.organization
        const tag: string = await OrganizationService.generateTag(jwt.user, organizationName)
        res.send({ tag })
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send("unauthorized")
                break
            case "invalid username provided":
                res.status(400).send(`invalid username provided. format must match regex: ${userValidations.username}`)
                break
            case "invalid organization name provided":
                res.status(400).send(`invalid organization name provided. format must match regex: ${organizationValidations.organization_name}`)
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
        const organizationName: string = req.params.organization

        res.send({
            isValid: await OrganizationService.verifyTag(jwt.user, organizationName, tag)
        })
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send("unauthorized")
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        } 
    }
})

app.post(routes.createOrganization, async (req, res) => {
    try{
        if(typeof(req.headers.authorization) !== "string" || req.headers.authorization.split(" ").length !== 2){
            throw new Error("bearer auth token is missing")
        }        
        const username: string = (await UserService.verifyAuthToken(req.headers.authorization.split(" ")[1])).user
        const organizationName: string = req.body.organizationName
        await OrganizationService.createOrganization(organizationName, username)
        res.status(201).send()
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send("unauthorized")
                break
            case "organization already exists":
                res.status(400).send("organization already exists")
                break
            case "invalid username provided":
                res.status(400).send(`invalid username provided. format must match regex: ${userValidations.username}`)
                break
            case "invalid organization name provided":
                res.status(400).send(`invalid organization name provided. format must match regex: ${organizationValidations.organization_name}`)                
                break
            case "captcha is required":
                res.status(400).send("captcha is required")
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.get(routes.readOrganization, async (req, res) => {
    try{
        if(typeof(req.headers.authorization) !== "string" || req.headers.authorization.split(" ").length !== 2){
            throw new Error("bearer auth token is missing")
        }
        const organizationName: string = req.params.organization
        const username: string = (await UserService.verifyAuthToken(req.headers.authorization.split(" ")[1])).user
        const organization: Organization = await OrganizationService.readOrganization(username, organizationName)
        res.status(200).send(OrganizationDTO.fromOrganization(organization))
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "insufficient permissions":
            case "unauthorized":
                res.status(401).send("unauthorized")
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.get(routes.readOrganizations, async (req, res) => {
    try{
        if(typeof(req.headers.authorization) !== "string"){
            throw new Error("bearer auth token is missing")
        }
        const username: string = (await UserService.verifyAuthToken(req.headers.authorization.split(" ")[1])).user
        const organizations = await OrganizationService.readOrganizations(username)
        res.status(200).send(organizations)
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send("unauthorized")
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
        const username: string = req.body.username
        const permissions: UserPermissions = req.body.permissions
        const organizationName: string = req.params.organization

        const member: Member = {
            username,
            organization: organizationName,
            permissions,
            tags: {
                tag_count: 0,
                timestamp: Date.now(),
            },
            creation_date: Date.now(),   
        }
    
        if(typeof(req.headers.authorization) !== "string"){
            throw new Error("unauthorized")
        }
    
        const jwt: JWT = UserService.verifyAuthToken(req.headers.authorization?.split(" ")[1])
        await OrganizationService.addMember(jwt, member)
        res.status(201).send()
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send("unauthorized")
                break
            case "unable to add more members to this organization":
                res.status(500).send("unable to add more members to this organization")
                break
            case "owner's username cannot be a member's username":
                res.status(400).send("owner's username cannot be a member's username")
                break
            case "member is existing user":
                res.status(400).send("unable to set password, member is an existing user. Include 'confirm' key in request body to confirm")
                break
            case "invalid username provided":
                res.status(400).send(`invalid username provided. format must match regex: ${userValidations.username}`)
                break
            case "invalid organization name provided":
                res.status(400).send(`invalid organization name provided. format must match regex: ${organizationValidations.organization_name}`)
                break
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
        await OrganizationService.deleteMember(jwt, organization, username)
        res.status(200).send()
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send("unauthorized")
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.post(routes.premium, async (req, res) => {
    try{
        const organizationName: string = req.params.organization
        const subscriptionDuration: number = req.body.duration
        const paymentCard: PaymentCard = req.body.cardDetails
       
        await OrganizationService.upgradeToPremium(organizationName, subscriptionDuration, paymentCard)
        res.send("organization upgraded to premium service")
    }
    catch(err){
        const error: Error = err as Error
        switch(error.message){
            case "unauthorized":
                res.status(401).send("unauthorized")
                break
            case "invalid duration selected":
                res.status(400).send("invalid duration selected. valid values are 2628000000 for 1 month, 15770000000 for six months, 31560000000 for 1 year, 63120000000 for 2 years")
                break
            case "payment error":
                res.status(500).send("an error occurred with the payment process")
                break
            default:
                logger(error.message)
                res.status(500).send("internal server error")
                break
        }
    }
})

app.get(routes.deals, async (req, res) => {
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

exports.api = functions.https.onRequest(app)