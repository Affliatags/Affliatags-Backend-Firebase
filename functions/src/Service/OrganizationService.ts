import { Organization } from "../Model/Organization"
import { Repository } from "../Repository/Repository"
import { Member } from "../Model/Member"
import { JWT } from "../Model/JWT"
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

    createOrganization: async (organizationName: string, username: string, captchaResponse?:string): Promise<string> => {
        if(userValidations.username?.test(username) === false){
            throw new Error("invalid username provided")
        }
        if(organizationValidations.organization_name?.test(organizationName) === false){
            throw new Error("invalid organization name provided")
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
            members: {},
            creation_date: Date.now(),
            tags: {
                tag_count: 0,
                timestamp: 0,
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
        const isMember: boolean = Repository.organization_members.read(organizationName, username) === undefined
        if(!isMember && organization.owner !== username){
            throw new Error("insufficient permissions")
        }
        organization.members = await Repository.organization_members.readAll(organizationName)
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
            const members = await Repository.organization_members.readAll(organization)
            response[organization] = {
                tags: {
                    tagCount: orgInfo.tags.tag_count, 
                    timestamp: orgInfo.tags.timestamp
                },
                memberCount: Object.keys(members).length
            }
        }
        return response
    },

    addMember: async (jwt: JWT, member: Member): Promise<void> => {
        if(userValidations.username?.test(member.username) === false){
            throw new Error("invalid username provided")
        }
        if(organizationValidations.organization_name?.test(member.organization) === false){
            throw new Error("invalid organization name provided")
        }
        const organization: Organization = await Repository.organizations.read(member.organization)
        if(organization.owner === member.username){
            throw new Error("owner's username cannot be a member's username")
        }
        const members = await Repository.organization_members.readAll(member.organization)
        if(Object.keys(members).length >= Environment.getMaxMembersPerOrganization()){
            throw new Error("unable to add more members to this organization")
        }
        
        const currentMember: Member = members[jwt.user]
        if (organization.owner !== jwt.user && currentMember.permissions.accounts.CREATE === false){
            throw new Error("unauthorized")
        }
        await Repository.organization_members.create(member.organization, member)
    },

    deleteMember: async (jwt: JWT, organizatioName: string, member: string) => {
        const owner = await Repository.users.read(jwt.user)
        const organization = await Repository.organizations.read(organizatioName)
        const memberDeletePermission = (await Repository.organization_members.read(organizatioName, jwt.user))?.permissions.accounts.DELETE ?? false
        if(owner.username !== organization.owner && memberDeletePermission === false){
            throw new Error("unauthorized")
        }
        await Repository.organization_members.delete(organizatioName, member)
    },

    removeMember: async (jwt: JWT, organizationName: string, username: string) => {
        const organization: Organization = await Repository.organizations.read(organizationName)
        const member = await Repository.organization_members.read(organizationName, username)
        if(member === undefined){
            throw new Error("could not perform this action")
        }
        if (organization.owner === jwt.user || member.permissions.accounts.DELETE){
            await Repository.organization_members.delete(organizationName, username)
            
        }
        else{
            throw new Error("unauthorized")
        }
    },

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

    generateTag: async (username: string, organizationName: string, captchaResponse?:string): Promise<string> => {
        if(userValidations.username?.test(username) === false){
            throw new Error("invalid username provided")
        }
        if(organizationValidations.organization_name?.test(organizationName) === false){
            throw new Error("invalid organization name provided")
        }

        const token: Tag = {
            token: uuidv4(),
            created_at: Date.now()
        }

        const organization = await Repository.organizations.read(organizationName)
        const organizationMembers = await Repository.organization_members.readAll(organizationName)
        let memberInfo: Member = organizationMembers[username]

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
                    }
                },
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

        if(Date.now() - organization.tags.timestamp >= TimePeriods.HOUR){
            organization.tags.tag_count = 0
            organization.tags.timestamp = Date.now()
        }

        if(
            organization.subscription.expiration_date !== null && 
            Date.now() >= organization.subscription.expiration_date && 
            organization.tags.tag_count >= Environment.getMaxUnsubscribedTagCountPerHour()
        ){
            throw new Error("organization token quota exceeded")
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
            organizationMembers[username] = memberInfo
            await Repository.organization_members.update(organizationName, organizationMembers)
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
        if(organization.owner !== username && organization.members[username] === undefined){
            throw new Error("unauthorized to perform this action")
        }

        if(tagInfo !== undefined){
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