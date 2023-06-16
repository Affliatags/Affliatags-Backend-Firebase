import { Organization } from "../Model/Organization";

export class OrganizationDTO {
    constructor(
        public organization_name: string,
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

    public static fromOrganization(organization: Organization){
        return new OrganizationDTO(
            organization.organization_name,
            organization.owner,
            organization.memberCount,
            organization.subscription,
            organization.tags,
            organization.creation_date,
            
        )
    }
}