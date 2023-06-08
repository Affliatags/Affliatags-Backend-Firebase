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

// app.get(routes.verifyTagWeb, async (req, res) => {
//     try{
//         const agree = req.query.agree
//         const organizationName = req.params.organization
//         const token = req.params.tag

//         if(agree === undefined){
//             res.send(`
//                 <html>
//                     <script>
//                         if (confirm("The scanned tag will now be verified, this process will void the tag. If you understand and accept this press OK") == true) {
//                             window.location.replace(window.location.toString() + "?agree")
//                         } else {
//                             window.close()
//                         }
//                     </script>
//                 </html>
//             `)
//             return
//         }
//         if(await OrganizationService.verifyTokenWeb(organizationName, token)){
//             res.send(`
//             <html>
//                 <head>
//                     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                     <style>
//                         h1 {
//                             font-family: arial;
//                             color: #29d038;
//                         }
//                         body{
//                             display: flex;
//                             justify-content: center;
//                             align-items: center;
//                             flex-direction: column;
//                             height: 100vh;
//                         }
//                         img{
//                             width: 256px;
//                             height: 256px;
//                         }                    
//                     </style>
//                 </head>
//                 <body>
//                     <div>
//                         <img src="data:image/png;base64,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">
//                     </div>
//                     <div>
//                         <h1>Verified</h1>
//                     </div>
//                 </body>
//             </html>            
//             `)
//             return
//         }
//         res.send(`
//         <html>
//             <head>
//                 <meta name="viewport" content="width=device-width, initial-scale=1.0">
//                 <style>
//                     h1 {
//                         font-family: arial;
//                         color: #ff4141;
//                     }
//                     body{
//                         display: flex;
//                         justify-content: center;
//                         align-items: center;
//                         flex-direction: column;
//                         height: 100vh;
//                     }
//                     img{
//                         width: 256px;
//                         height: 256px;
//                     }
//                 </style>
//             </head>
//             <body>
//                 <div>
//                     <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTITu5AV-r5S1VlM177o0xat54KF9Pe9dh2R_Zt0vvF3Yr6_N785RXhJNsa6mIIlfVvVMs&usqp=CAU">
//                 </div>
//                 <div>
//                     <h1>Verification Failed</h1>
//                 </div>
//             </body>
//         </html>
//         `)
//     }
//     catch(err){
//         const error: Error = err as Error
//         switch(error.message){
//             default:
//                 logger(error.message)
//                 res.status(500).send("internal server error")
//         } 
//     }
// })

exports.api = functions.https.onRequest(app)