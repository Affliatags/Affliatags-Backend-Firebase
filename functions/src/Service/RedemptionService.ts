import { Redemption } from "../Model/Redemption";
import { Repository } from "../Repository/Repository";

export const RedemptionService = {
    getRedemptionsForGroup: async (username: string, organization: string, monthsAgo: 0 | 1 | 2 | 3, year: number, filter: string, offset: number, limit: number): Promise<Array<Redemption>> => {
        if(limit > 30 || limit <= 0){
            limit = 30
        }
        const member = Repository.group_members.read(organization, username)
        if(member === undefined){
            throw new Error("unauthorized")
        }
        if(monthsAgo < 0 || monthsAgo > 3){
            throw new Error("only redemptions for up to three months ago are provided")
        }
        const redepmtions = await Repository.redemptions.readAll(organization, monthsAgo, year, filter, offset, limit)
        const result: Array<Redemption> = []
        for(const redemption of redepmtions){
            result.push(Object.values(redemption)[0])
        }
        return result
    },

    getTotalRedemptionCount: async (organization: string, monthsAgo: 0 | 1 | 2 | 3, year: number): Promise<number> => {
        return await Repository.redemptions.readTotalRedemption(organization, monthsAgo, year)
    },

    readRedemptionForUser: async (username: string, organization: string, monthsAgo: 0 | 1 | 2 | 3): Promise<Redemption> => {
        const member = Repository.group_members.read(organization, username)
        if(member === undefined){
            throw new Error("unauthorized")
        }
        if(monthsAgo < 0 || monthsAgo > 3){
            throw new Error("only redemptions for up to three months ago are provided")
        }
        return await Repository.redemptions.read(organization, username, monthsAgo, (new Date()).getFullYear()) ?? {
            username,
            redemptionCount: 0
        }
    },

    // incrementRedemption: async (organization: string, username: string): Promise<void> => {
    //     const member = Repository.group_members.read(organization, username)
    //     if(member === undefined){
    //         throw new Error("unauthorized")
    //     }
    //     if(monthsAgo < 0 || monthsAgo > 3){
    //         throw new Error("only redemptions for up to three months ago are provided")
    //     }
    //     const redemption = await Repository.redemptions.read(organization, username, monthsAgo, (new Date()).getFullYear()) ?? {
    //         username,
    //         redemptionCount: 0
    //     }
    // }
}