import { Group } from "../Model/Group";

export class GroupDTO {
    constructor(
        public organization: string,
        public owner: string,
        public memberCount: number,
        public subscription: {
            last_renewal_date: number | null,
            expiration_date: number | null,
        },
        public tags: {
            tag_count: number,
            timestamp: number,
        },
        public creation_date: number
    ){ }

    public static fromOrganization(group: Group){
        return new GroupDTO(
            group.organization,
            group.owner,
            group.memberCount,
            group.subscription,
            group.tags,
            group.creation_date,
            
        )
    }
}