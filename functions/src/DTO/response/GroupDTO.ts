import { Group } from "../../Model/Group";

export class GroupDTO {
    public totalRedemptions: number = 0
    constructor(
        public logo: string | null,
        public organization: string,
        public owner: string,
        public memberCount: number,
        public instagram: string | null,
        public subscription: {
            lastRenewalDate: number | null,
            expirationDate: number | null,
        },
        public tags: {
            tagCount: number,
            timestamp: number,
        },
        public creationDate: number,
    ){ }

    public static fromGroup(group: Group){
        return new GroupDTO(
            group.logo,
            group.organization,
            group.owner,
            group.memberCount,
            group.instagram,
            {
                expirationDate: group.subscription.expirationDate,
                lastRenewalDate: group.subscription.lastRenewalDate, 
            },
            {
                tagCount: group.tags.tagCount,
                timestamp: group.tags.timestamp,
            },
            group.creationDate,
            
        )
    }
}