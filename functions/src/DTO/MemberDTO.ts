import { Member } from "../Model/Member";
import { UserPermissions } from "../Model/UserPermission";

export class MemberDTO {
    constructor(
        public permissions: UserPermissions,
        public creation_date: number,
        public tags: {
            tag_count: number,
            timestamp: number,
        }
    ){ }

    public static fromMember(member: Member): MemberDTO{
        return new MemberDTO(
            member.permissions,
            member.creation_date,
            member.tags
        )
    }
}