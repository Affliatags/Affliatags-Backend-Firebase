import { Organization } from "../Model/Organization";
import { MemberDTO } from "./MemberDTO";

export class OrganizationDTO {
    constructor(
        public organization_name: string,
        public owner: string,
        public members: Record<string, MemberDTO>,
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
        const members: Record<string, MemberDTO> = {} 

        for(const member of Object.keys(organization.members)){
            members[member] = MemberDTO.fromMember(organization.members[member])
        }

        return new OrganizationDTO(
            organization.organization_name,
            organization.owner,
            members,
            organization.subscription,
            organization.tags,
            organization.creation_date,
            
        )
    }
}