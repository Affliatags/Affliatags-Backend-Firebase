import { Organization } from "../Model/Organization"
import { Repository } from "../Repository/Repository"
import { Member } from "../Model/Member"
import { v4 as uuidv4 } from 'uuid'
import { Environment } from "../Constants/environment"
import { TimePeriods } from "../Constants/TimePeroids"
import { PaymentCard } from "../Model/PaymentCard"
import { PaymentGatewayClient } from "../Client/PaymentGatewayClient"
import { User } from "../Model/User"
import { Tag } from "../Model/Tag"
import { DealDurations } from "../Constants/DealDurations"
import { organizationValidations } from "../Util/validations/organizationValidations"
import { userValidations } from "../Util/validations/userValidations"

export const OrganizationService = Object.freeze({

    createOrganization: async (organizationName: string, username: string, instagram: string, tagExpiration: number, captchaResponse?:string): Promise<string> => {
        if(userValidations.username?.test(username) === false){
            throw new Error("invalid username provided")
        }
        if(organizationValidations.organization_name?.test(organizationName) === false){
            throw new Error("invalid organization name provided")
        }
        if(organizationValidations.instagram?.test(instagram) === false){
            throw new Error("invalid instagram name provided")
        }
        const user: User = await Repository.users.read(username)

        let captchaRequired: boolean = false
        for(const organizationTimestamp of Object.values(user.organizations)){
            if(Date.now() - organizationTimestamp <= TimePeriods.HOUR){
                captchaRequired = true
                break
            }
        }

        if(captchaRequired && captchaResponse === undefined && Environment.getEnableCaptcha()){
            throw new Error("captcha is required")
        }

        try{
            if(organizationName.length > 30){
                throw new Error("organization name is too long")
            }
            if(/^[a-z0-9 _]{1,}$/g.test(organizationName) === false){
                throw new Error("invalid organization name")
            }
            await Repository.organizations.read(organizationName)
            throw new Error("organization already exists")
        }
        catch(err){
            const error: Error = err as Error
            if(error.message.indexOf("organization was not found") === -1){
                throw error
            }
        }

        const organization: Organization = {
            organization_name: organizationName,
            owner: username,
            memberCount: 0,
            instagram,
            creation_date: Date.now(),
            tags: {
                tag_count: 0,
                timestamp: 0,
                expiration: tagExpiration,
            },
            subscription: {
                last_renewal_date: null,
                expiration_date: Date.now() - 1000
            },
        }

        const result = await Repository.organizations.create(organization)
        user.organizations[organization.organization_name] = Date.now()
        await Repository.users.create(user)

        return result
    },

    readOrganization: async (username: string, organizationName: string): Promise<Organization> => {
        const organization: Organization = await Repository.organizations.read(organizationName)
        organization.tags.expiration = Environment.getEnablePremium() ? organization.tags.expiration : (new Date("'Sat Dec 31 9999'")).getTime()
        const isMember: boolean = Repository.organization_members.read(organizationName, username) === undefined
        if(!isMember && organization.owner !== username){
            throw new Error("insufficient permissions")
        }
        organization.memberCount = await Repository.organization_members.readLength(organizationName)
        return organization
    },

    readOrganizations: async (username: string): Promise<{[key: string]: {
        tags: {
            tagCount: number,
            timestamp: number,
        },
        memberCount: number
    }}> => {
        const response:{[key: string]: {
            tags: {
                tagCount: number,
                timestamp: number,
            },
            memberCount: number
        }} = {}
        const user = await Repository.users.read(username)
        const organizations = Object.keys(user.organizations)
        for(const organization of organizations){
            const orgInfo = await Repository.organizations.read(organization)
            response[organization] = {
                tags: {
                    tagCount: orgInfo.tags.tag_count, 
                    timestamp: orgInfo.tags.timestamp
                },
                memberCount: await Repository.organization_members.readLength(organization)
            }
        }
        return response
    },

    // removeMember: async (jwt: JWT, organizationName: string, username: string) => {
    //     const organization: Organization = await Repository.organizations.read(organizationName)
    //     const member = await Repository.organization_members.read(organizationName, username)
    //     if(member === undefined){
    //         throw new Error("could not perform this action")
    //     }
    //     if (organization.owner === jwt.user || member.permissions.accounts.DELETE){
    //         await Repository.organization_members.delete(organizationName, username)
            
    //     }
    //     else{
    //         throw new Error("unauthorized")
    //     }
    // },

    upgradeToPremium: async (organizationName: string, duration: number, card: PaymentCard) => {
        const organization: Organization = await Repository.organizations.read(organizationName)
        organization.subscription = {
            last_renewal_date: Date.now(),
            expiration_date: organization.subscription.expiration_date === undefined || 
                organization.subscription.expiration_date === null || 
                organization.subscription.expiration_date <= Date.now() 
                    ? Date.now() + duration 
                    : organization.subscription.expiration_date + duration,
        }

        const dealDurations: Record<string, boolean> = {}
        for(const dealDuration of Object.values(DealDurations)){
            dealDurations[dealDuration.toString()] = true
        }

        if(dealDurations[duration.toString()] !== true){
            throw new Error("invalid duration selected")
        }
        
        let cost: number = Environment.getSilverDealCost()
        if(Date.now() - duration >= TimePeriods.SIX_MONTH && Date.now() - duration < TimePeriods.YEAR){
            cost = Environment.getGoldDealCost()
        }
        else if(Date.now() - duration >= TimePeriods.YEAR && Date.now() - duration < TimePeriods.TWO_YEAR){
            cost = Environment.getPlatinumDealCost()
        }
        else {
            cost = Environment.getPlatinumDealCost()
        }

        const totalCost: number = cost * duration / TimePeriods.MONTH

        if(Environment.getEnableCardPayment() === true){
            await PaymentGatewayClient.chargeCard(card, totalCost)
        }
        await Repository.organizations.update(organization.organization_name, organization)
    },

    generateTag: async (username: string, organizationName: string, description: string, expiration: number, captchaResponse?:string): Promise<string> => {
        if(userValidations.username?.test(username) === false){
            throw new Error("invalid username provided")
        }
        if(organizationValidations.organization_name?.test(organizationName) === false){
            throw new Error("invalid organization name provided")
        }
        if(organizationValidations.organization_name?.test(organizationName) === false){
            throw new Error("invalid tag description provided")
        }
        if(organizationValidations.creation_date?.test(expiration) === false){
            throw new Error("invalid expiration provided")
        }

        const organization = await Repository.organizations.read(organizationName)
        let memberInfo: Member | undefined = await Repository.organization_members.read(organizationName, username)

        if(memberInfo === undefined){
            throw new Error("unauthorized")
        }

        const token: Tag = {
            token: uuidv4(),
            description,
            created_at: Date.now(),
            expiration: Date.now() + organization.tags.expiration
        }

        if(Date.now() - organization.tags.timestamp >= TimePeriods.HOUR){
            organization.tags.tag_count = 0
            organization.tags.timestamp = Date.now()
        }

        if(
            organization.subscription.expiration_date !== null && 
            Date.now() >= organization.subscription.expiration_date && 
            organization.tags.tag_count >= Environment.getMaxUnsubscribedTagCountPerHour() &&
            Environment.getEnablePremium() === false
        ){
            throw new Error("organization token quota exceeded")
        }        

        if(username === organization.owner && memberInfo === undefined){
            memberInfo = {
                username,
                organization: organizationName,
                permissions :{ 
                    tokensPerHour: 6,
                    accounts: {
                        CREATE: false,
                        READ: false,
                        UPDATE: false,
                        DELETE: false,
                    },
                    allowGenerateTags: true,
                    allowScanTags: false,
                },
                tag_description: description,
                tags: {
                    tag_count: 0,
                    timestamp: Date.now(),
                },
                creation_date: Date.now(),   
            }
            await Repository.organization_members.create(organizationName, memberInfo)
        }
        else if(memberInfo === undefined){
            throw new Error("unauthorized")
        }

        if(memberInfo !== undefined){
            if(Date.now() - memberInfo.tags.timestamp >= TimePeriods.HOUR){
                memberInfo.tags.tag_count = 0
                memberInfo.tags.timestamp = Date.now()
            }

            if(
                memberInfo.permissions.tokensPerHour !== null && 
                Date.now() - memberInfo.tags.timestamp < TimePeriods.HOUR && 
                memberInfo.tags.tag_count >= memberInfo.permissions.tokensPerHour
            ){
                throw new Error("member token quota exceeded")
            }

            memberInfo.tags.tag_count += 1
            await Repository.organization_members.create(organizationName, memberInfo)
        }

        const tags: Record<string, Tag> = await Repository.tags.readAll(organizationName)
        const tagsToBeRemoved: Array<string> = []
        let recentCreatedTagCount = 0

        for(const tag of Object.values(tags)){
            if(Date.now() - tag.created_at <= TimePeriods.HOUR){
                recentCreatedTagCount += 1
                continue
            }
            tagsToBeRemoved.push(tag.token)
        }

        Repository.tags.deleteOutdatedTagsFromIndexer(organizationName, tagsToBeRemoved)
        if(recentCreatedTagCount >= Environment.getMaxTagsPerHourUntilCaptchaRequired() && captchaResponse === undefined && Environment.getEnableCaptcha()){
            throw new Error("captcha is required")
        }

        organization.tags.tag_count += 1
        await Repository.organizations.update(organizationName, organization)
        await Repository.tags.create(organizationName, token)
        return token.token
    },

    verifyTag: async (username: string, organizationName: string, tag: string): Promise<boolean> => {
        const tagInfo: Tag | undefined = await Repository.tags.read(organizationName, tag)

        const organization = await Repository.organizations.read(organizationName)
        const member: Member | undefined = await Repository.organization_members.read(organizationName, username)
        if(organization.owner !== username && (member === undefined || member.permissions.allowScanTags === false)){
            throw new Error("unauthorized to perform this action")
        }

        if(tagInfo !== undefined){
            if(Date.now() >=  tagInfo.expiration){
                return  false
            }
            await Repository.tags.delete(organizationName, tag)
            return true
        }
        return false
    },

    verifyTokenWeb: async (organizationName: string, token: string): Promise<boolean> => {
        const tagInfo: Tag | undefined = await Repository.tags.read(organizationName, token)

        if(tagInfo !== undefined){
            await Repository.tags.delete(organizationName, token)
            return true
        }
        return false
    },

})