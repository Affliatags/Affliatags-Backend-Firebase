import { Group } from "../Model/Group"
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
import { groupValidations } from "../Util/validations/groupValidations"
import { userValidations } from "../Util/validations/userValidations"

export const GroupService = Object.freeze({

    createGroup: async (username: string, organization: string, tagExpiration: number, captchaResponse?:string): Promise<string> => {
        if(userValidations.username?.test(username) === false){
            throw new Error("invalid username provided")
        }
        if(groupValidations.organization?.test(organization) === false){
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
            await Repository.groups.read(organization)
            throw new Error("organization already exists")
        }
        catch(err){
            const error: Error = err as Error
            if(error.message.indexOf("organization was not found") === -1){
                throw error
            }
        }

        const group: Group = {
            organization,
            owner: username,
            memberCount: 0,
            instagram: null,
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
            instagramVerificationCode: null
        }

        const result = await Repository.groups.create(group)
        user.organizations[group.organization] = Date.now()
        await Repository.users.create(user)

        return result
    },

    addGroupInstagram: async (ownerUsername: string, organization: string, instagram: string): Promise<string | undefined> => {
        if(groupValidations.instagram?.test(instagram) === false){
            throw new Error("invalid instagram name provided")
        }
        const group: Group = await Repository.groups.read(organization)
        if(group.owner !== ownerUsername){
            throw new Error("unauthorized to perform this action")
        }
        if(group.instagramVerificationCode === undefined || group.instagramVerificationCode === null || Date.now() >= group.instagramVerificationCode.expires){
            const verificationCode = uuidv4()
            group.instagramVerificationCode = {
                code: verificationCode,
                expires: Date.now() + 300000
            }
            await Repository.groups.update(group.organization, group)
            return verificationCode
        }
        const response: Response = await fetch(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${instagram}`, {
            "credentials": "include",
            "headers": {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/113.0",
                "Accept": "*/*",
                "Accept-Language": "en-US,en;q=0.5",
                "X-CSRFToken": "WvuAlUWMfrljSlWQob1QzTIO5EzZgVom",
                "X-IG-App-ID": "936619743392459",
                "X-ASBD-ID": "129477",
                "X-IG-WWW-Claim": "0",
                "X-Requested-With": "XMLHttpRequest",
                "Alt-Used": "www.instagram.com",
                "Sec-Fetch-Dest": "empty",
                "Sec-Fetch-Mode": "cors",
                "Sec-Fetch-Site": "same-origin"
            },
            "referrer": `https://www.instagram.com/${instagram}/`,
            "method": "GET",
            "mode": "cors"
        });
        const responseJSON = await response.json()
        if(String(responseJSON["data"]["user"]["biography"]).indexOf(group.instagramVerificationCode.code) !== -1){
            group.instagram = instagram
            await Repository.groups.update(group.organization, group)
            return undefined
        }
        throw new Error("pending verification code not found on instagram page")
    },

    readGroup: async (username: string, organization: string): Promise<Group> => {
        const group: Group = await Repository.groups.read(organization)
        group.tags.expiration = Environment.getEnablePremium() ? group.tags.expiration : (new Date("'Sat Dec 31 9999'")).getTime()
        const isMember: boolean = Repository.group_members.read(organization, username) === undefined
        if(!isMember && group.owner !== username){
            throw new Error("insufficient permissions")
        }
        group.memberCount = await Repository.group_members.readLength(organization)
        return group
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
            const orgInfo = await Repository.groups.read(organization)
            response[organization] = {
                tags: {
                    tagCount: orgInfo.tags.tag_count, 
                    timestamp: orgInfo.tags.timestamp
                },
                memberCount: await Repository.group_members.readLength(organization)
            }
        }
        return response
    },

    // removeMember: async (jwt: JWT, organizationName: string, username: string) => {
    //     const group: Group = await Repository.groups.read(organizationName)
    //     const member = await Repository.group_members.read(organizationName, username)
    //     if(member === undefined){
    //         throw new Error("could not perform this action")
    //     }
    //     if (group.owner === jwt.user || member.permissions.accounts.DELETE){
    //         await Repository.group_members.delete(organizationName, username)
            
    //     }
    //     else{
    //         throw new Error("unauthorized")
    //     }
    // },

    upgradeToPremium: async (organization: string, duration: number, card: PaymentCard) => {
        const group: Group = await Repository.groups.read(organization)
        group.subscription = {
            last_renewal_date: Date.now(),
            expiration_date: group.subscription.expiration_date === undefined || 
                group.subscription.expiration_date === null || 
                group.subscription.expiration_date <= Date.now() 
                    ? Date.now() + duration 
                    : group.subscription.expiration_date + duration,
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
        await Repository.groups.update(organization, group)
    },

    generateTag: async (username: string, organizationName: string, description: string, expiration: number, captchaResponse?:string): Promise<string> => {
        if(userValidations.username?.test(username) === false){
            throw new Error("invalid username provided")
        }
        if(groupValidations.organization?.test(organizationName) === false){
            throw new Error("invalid organization name provided")
        }
        if(groupValidations.organization?.test(organizationName) === false){
            throw new Error("invalid tag description provided")
        }
        if(groupValidations.creation_date?.test(expiration) === false){
            throw new Error("invalid expiration provided")
        }

        const group = await Repository.groups.read(organizationName)
        let memberInfo: Member | undefined = await Repository.group_members.read(organizationName, username)

        if(memberInfo === undefined){
            throw new Error("unauthorized")
        }

        const token: Tag = {
            token: uuidv4(),
            description,
            created_at: Date.now(),
            expiration: group.tags.expiration == null ? null : Date.now() + group.tags.expiration
        }

        if(Date.now() - group.tags.timestamp >= TimePeriods.HOUR){
            group.tags.tag_count = 0
            group.tags.timestamp = Date.now()
        }

        if(
            group.subscription.expiration_date !== null && 
            Date.now() >= group.subscription.expiration_date && 
            group.tags.tag_count >= Environment.getMaxUnsubscribedTagCountPerHour() &&
            Environment.getEnablePremium() === false
        ){
            throw new Error("organization token quota exceeded")
        }        

        if(username === group.owner && memberInfo === undefined){
            memberInfo = {
                username,
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
            await Repository.group_members.create(organizationName, memberInfo)
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
            await Repository.group_members.create(organizationName, memberInfo)
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

        group.tags.tag_count += 1
        await Repository.groups.update(organizationName, group)
        await Repository.tags.create(organizationName, token)
        return token.token
    },

    verifyTag: async (username: string, organizationName: string, tag: string): Promise<boolean> => {
        const tagInfo: Tag | undefined = await Repository.tags.read(organizationName, tag)

        const group = await Repository.groups.read(organizationName)
        const member: Member | undefined = await Repository.group_members.read(organizationName, username)
        if(group.owner !== username && (member === undefined || member.permissions.allowScanTags === false)){
            throw new Error("unauthorized to perform this action")
        }

        if(tagInfo !== undefined){
            if(tagInfo.expiration !== null && Date.now() >=  tagInfo.expiration){
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