import { Member } from "../Model/Member";
import { User } from "../Model/User";
import { UserPermissions } from "../Model/UserPermission";

export class MemberDTO {
    constructor(
        public profilePhoto: string | null,
        public username: string,
        public permissions: UserPermissions,
        public creationDate: number,
        public tags: {
            tagCount: number,
            timestamp: number,
        },
        public tagDescription: string,
        public tagExpiration: number | null,
        public tagGenerationLimit: number | null,
    ){ }

    public static fromMember(user: User, member: Member): MemberDTO{
        return new MemberDTO(
            user.profilePhoto,
            member.username,
            member.permissions,
            member.creationDate,
            {
                tagCount: member.tags.tagCount,
                timestamp: member.tags.timestamp,
            },
            member.tagDescription,
            member.tagExpiration,
            member.tags.tagGenerationLimit,
        )
    }
}