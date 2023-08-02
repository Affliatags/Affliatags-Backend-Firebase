import { Group } from "../Model/Group"
import { Repository } from "../Repository/Repository"
import { Member } from "../Model/Member"
import { Environment } from "../Constants/environment"
import { TimePeriods } from "../Constants/TimePeroids"
import { PaymentCard } from "../Model/PaymentCard"
import { PaymentGatewayClient } from "../Client/PaymentGatewayClient"
import { User } from "../Model/User"
import { Tag } from "../Model/Tag"
import { DealDurations } from "../Constants/DealDurations"
import { Redemption } from "../Model/Redemption"
import { GroupDTO } from "../DTO/response/GroupDTO"
import { HCaptchaClient } from "../Client/HCaptchaClient"
import * as RandExp from "randexp"

export const GroupService = Object.freeze({

    createGroup: async (username: string, organization: string, captchaResponse:string | null): Promise<string> => {
        const user: User = await Repository.users.read(username)

        let captchaRequired: boolean = false
        for(const organizationTimestamp of Object.values(user.organizations)){
            if(Date.now() - organizationTimestamp <= TimePeriods.HOUR){
                captchaRequired = true
                break
            }
        }

        if(captchaRequired && captchaResponse === null && Environment.getEnableCaptcha()){
            throw new Error("captcha is required")
        }

        if(captchaRequired && captchaResponse !== null && Environment.getEnableCaptcha()){
            const captchaVerificationSuccessful = await HCaptchaClient.verifyCaptcha(captchaResponse)
            if(captchaVerificationSuccessful === false){
                throw new Error("incorrect captcha provided")
            }
        }

        try{
            // TODO: Implement captcha verification
            await Repository.groups.read(organization)
            throw new Error("organization already exists")
        }
        catch(err){
            const error: Error = err as Error
            if(error.message.indexOf("organization was not found") === -1){
                throw error
            }
        }

        const groupCount = await Repository.groups.readOwnerGroupsLength(username)
        if(groupCount >= 10){
            throw new Error("maximum groups for user reached")
        }

        const group: Group = {
            logo: null,
            organization,
            owner: username,
            memberCount: 0,
            instagram: null,
            creationDate: Date.now(),
            tags: {
                tagCount: 0,
                timestamp: 0,
            },
            subscription: {
                lastRenewalDate: null,
                expirationDate: Date.now() - 1000
            },
            instagramVerificationCode: null
        }

        const result = await Repository.groups.create(group)
        user.organizations[group.organization] = Date.now()
        await Repository.users.create(user)

        return result
    },

    addGroupInstagram: async (ownerUsername: string, organization: string, instagram: string): Promise<string | undefined> => {
        const group: Group | undefined = await Repository.groups.read(organization)
        if(group === undefined){
            throw new Error("group not found")
        }
        if(group.owner !== ownerUsername){
            throw new Error("unauthorized to perform this action")
        }
        if(group.instagramVerificationCode === undefined || group.instagramVerificationCode === null || Date.now() >= group.instagramVerificationCode.expires){
            const verificationCode = new RandExp(/^[A-Z1-9]{6}$/).gen()
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

    updateGroupLogo: async (ownerUsername: string,  organization: string, logo: string) => {
        const group: Group | undefined = await Repository.groups.read(organization)
        if(group === undefined){
            throw new Error("group not found")
        }
        if( group.owner !== ownerUsername){
            throw new Error("unauthorized")
        }
        group.logo = logo
        await Repository.groups.update(organization, group)
    },

    readGroup: async (username: string, organization: string): Promise<GroupDTO> => {
        const group: Group | undefined = await Repository.groups.read(organization)
        if(group === undefined){
            throw new Error("group not found")
        }
        if(Date.now() - group.tags.timestamp >= TimePeriods.HOUR){
            group.tags.tagCount = 0
            group.tags.timestamp = Date.now()
        }        
        const isMember: boolean = Repository.group_members.read(organization, username) === undefined
        if(isMember === false && group.owner !== username){
            throw new Error("unauthorized")
        }
        group.memberCount = await Repository.group_members.readLength(organization)
        Repository.groups.update(organization, group)
        const groupDTO = GroupDTO.fromGroup(group)
        const currentDate = new Date()
        groupDTO.totalRedemptions = await Repository.redemptions.readTotalRedemption(group.organization, currentDate.getMonth() as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11, currentDate.getFullYear())
        return GroupDTO.fromGroup(group)
    },

    readGroups: async (username: string): Promise<Array<GroupDTO>> => {
        const groups: Array<Group> = await Repository.groups.readOwnerGroups(username)
        const groupDTOs: Array<GroupDTO> = []
        for(const group of groups){
            if(Date.now() - group.tags.timestamp >= TimePeriods.HOUR){
                group.tags.tagCount = 0
                group.tags.timestamp = Date.now()
                Repository.groups.update(group.organization, group)
            }
            const groupDTO = GroupDTO.fromGroup(group)
            const currentDate = new Date()
            groupDTO.totalRedemptions = await Repository.redemptions.readTotalRedemption(group.organization, currentDate.getMonth() as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11, currentDate.getFullYear())
            groupDTOs.push(GroupDTO.fromGroup(group))
        }
        return groupDTOs
    },

    deleteGroup: async (ownerUsername: string, organization: string) => {
        const group: Group | undefined = await Repository.groups.read(organization)
        if(group === undefined){
            throw new Error("group not found")
        }
        if(ownerUsername === group.owner){
            await Repository.groups.delete(organization)
        }
    },

    upgradeToPremium: async (organization: string, duration: number, card: PaymentCard) => {
        const group: Group | undefined = await Repository.groups.read(organization)
        if(group === undefined){
            throw new Error("group not found")
        }
        group.subscription = {
            lastRenewalDate: Date.now(),
            expirationDate: group.subscription.expirationDate === undefined || 
                group.subscription.expirationDate === null || 
                group.subscription.expirationDate <= Date.now() 
                    ? Date.now() + duration 
                    : group.subscription.expirationDate + duration,
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

    generateTag: async (username: string, organization: string, description: string, expiration: number | null, captchaResponse:string | null): Promise<string> => {
        const group = await Repository.groups.read(organization)
        if(group === undefined){
            throw new Error("group not found")
        }
        
        let memberInfo: Member | undefined = await Repository.group_members.read(organization, username)
        
        if(group.owner !== username && memberInfo === undefined){
            throw new Error("unauthorized")
        }

        if(memberInfo !== undefined && memberInfo.permissions.allowGenerateTags !== true){
            throw new Error("unauthorized")
        }

        const token: Tag = {
            token: new RandExp(/^[A-Z1-9]{6}$/).gen(),
            description: memberInfo?.tagDescription ?? "",
            createdBy: memberInfo === undefined ? group.owner : memberInfo.username,
            createdAt: Date.now(),
            expiration: memberInfo === null || memberInfo === undefined || memberInfo.tagExpiration === null ? null : Date.now() + memberInfo.tagExpiration
        }

        if(Date.now() - group.tags.timestamp >= TimePeriods.HOUR){
            group.tags.tagCount = 0
            group.tags.timestamp = Date.now()
        }

        if(
            group.subscription.expirationDate !== null && 
            Date.now() >= group.subscription.expirationDate && 
            group.tags.tagCount >= Environment.getMaxUnsubscribedTagCountPerHour() &&
            Environment.getEnablePremium() !== true
        ){
            throw new Error("organization token quota exceeded")
        }        

        if(username !== group.owner && memberInfo !== undefined  && (memberInfo.tagDescription !== description || memberInfo.tagExpiration !== expiration) && memberInfo.permissions.accounts.UPDATE !== true){
            throw new Error("unauthorized to perform this action, cannot update tag description")
        }

        if(memberInfo !== undefined){
            if(Date.now() - memberInfo.tags.timestamp >= TimePeriods.HOUR){
                memberInfo.tags.tagCount = 0
                memberInfo.tags.timestamp = Date.now()
            }

            if(
                memberInfo.permissions.tagsPerHour !== null && 
                Date.now() - memberInfo.tags.timestamp < TimePeriods.HOUR && 
                memberInfo.tags.tagCount >= memberInfo.permissions.tagsPerHour ||
                memberInfo.tags.tagGenerationLimit !== null && memberInfo.tags.totalTagCount >= memberInfo.tags.tagGenerationLimit
            ){
                throw new Error("member token quota exceeded")
            }

            memberInfo.tags.tagCount += 1
            memberInfo.tags.totalTagCount += 1
            await Repository.group_members.create(organization, memberInfo)
        }

        const tags: Record<string, Tag> = await Repository.tags.readAll(organization)
        const tagsToBeRemoved: Array<string> = []
        let recentCreatedTagCount = 0

        for(const tag of Object.values(tags)){
            if(Date.now() - tag.createdAt <= TimePeriods.HOUR){
                recentCreatedTagCount += 1
                continue
            }
            tagsToBeRemoved.push(tag.token)
        }

        Repository.tags.deleteOutdatedTagsFromIndexer(organization, tagsToBeRemoved)
        if(recentCreatedTagCount >= Environment.getMaxTagsPerHourUntilCaptchaRequired() && captchaResponse === null && Environment.getEnableCaptcha()){
            throw new Error("captcha is required")
        }

        if(recentCreatedTagCount >= Environment.getMaxTagsPerHourUntilCaptchaRequired() && captchaResponse !== null && Environment.getEnableCaptcha()){
            const captchaVerificationSuccessful = await HCaptchaClient.verifyCaptcha(captchaResponse)
            if(captchaVerificationSuccessful === false){
                throw new Error("incorrect captcha provided")
            }
        }

        group.tags.tagCount += 1
        await Repository.groups.update(organization, group)
        await Repository.tags.create(organization, token)
        return token.token
    },

    verifyTag: async (username: string, organization: string, tag: string): Promise<boolean> => {
        const tagInfo: Tag | undefined = await Repository.tags.read(organization, tag)

        const group = await Repository.groups.read(organization)
        if(group === undefined){
            throw new Error("group not found")
        }

        const member: Member | undefined = await Repository.group_members.read(organization, username)
        if(group.owner !== username && (member === undefined || member.permissions.allowScanTags !== true)){
            throw new Error("unauthorized to perform this action")
        }

        if(member !== undefined && member.permissions.allowScanTags !== true){
            throw new Error("unauthorized")
        }

        if(tagInfo !== undefined){
            if(tagInfo.expiration !== null && Date.now() >=  tagInfo.expiration){
                return  false
            }
            await Repository.tags.delete(organization, tag)
            if(member !== undefined){
                const currentDate: Date = new Date()
                let redemption: Redemption | undefined = await Repository.redemptions.read(organization, member.username, currentDate.getMonth() as any, currentDate.getFullYear())
                if(redemption === undefined){
                    redemption = {
                        redemptionCount: 0,
                        username: member.username
                    }
                }
                redemption.redemptionCount += 1
                Repository.redemptions.update(organization, redemption, currentDate.getMonth() as any, currentDate.getFullYear())
                Repository.group_members.update(organization, member)
            }
            return true
    }
        return false
    },

    // resetTagRedeemCount: async (ownerUsername: string, organization: string, memberUsername: string) => {
    //     const group: Group | undefined = await Repository.groups.read(organization)
    //     if(group === undefined || group.owner !== ownerUsername){
    //         throw new Error("unauthorized")
    //     }
    //     const memberInfo: Member | undefined = await Repository.group_members.read(organization, memberUsername)
    //     if(memberInfo === undefined){
    //         throw new Error("invalid member provided")
    //     }
    //     memberInfo.tags.redeemCount = 0
    //     await Repository.group_members.update(organization, memberInfo)
    // },

    verifyTokenWeb: async (organization: string, token: string): Promise<boolean> => {
        const tagInfo: Tag | undefined = await Repository.tags.read(organization, token)

        if(tagInfo !== undefined){
            await Repository.tags.delete(organization, token)
            return true
        }
        return false
    },

})