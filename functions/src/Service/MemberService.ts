import { Environment } from "../Constants/environment"
import { Member } from "../Model/Member"
import { Group } from "../Model/Group"
import { User } from "../Model/User"
import { UserPermissions } from "../Model/UserPermission"
import { Repository } from "../Repository/Repository"
import { memberValidations } from "../Util/validations/memberValidations"
import { userValidations } from "../Util/validations/userValidations"
import { TimePeriods } from "../Constants/TimePeroids"

export const MemberService = Object.freeze({
    addMember: async (ownerUsername: string, organization: string, member: Member): Promise<void> => {
        if(userValidations.username?.test(member.username) !== true){
            throw new Error("invalid username provided")
        }
        if(memberValidations.tagDescription?.test(member.tagDescription) !== true){
            throw new Error("invalid tag description provided")
        }
        const group: Group | undefined = await Repository.groups.read(organization)
        if(group === undefined){
            throw new Error("unauthorized")
        }
        
        if(group.owner === member.username){
            throw new Error("owner's username cannot be a member's username")
        }
        const totalMembers = await Repository.group_members.readLength(organization)
        if(Object.keys(totalMembers).length >= Environment.getMaxMembersPerOrganization()){
            throw new Error("unable to add more members to this organization")
        }

        const currentMember: Member | undefined = await Repository.group_members.read(group.organization, member.username)
        if (group.owner !== ownerUsername && (currentMember?.permissions?.accounts?.CREATE ?? false)){
            throw new Error("not authorized to perform this action")
        }

        await Repository.group_members.create(organization, member)
    },
    readMembers: async (username: string, organization: string, filter: string, offset: number, limit: number): Promise<Array<Member>> => {
        const group: Group | undefined = await Repository.groups.read(organization)
        if(group === undefined){
            throw new Error("unauthorized")
        }

        const member: Member | undefined = await Repository.group_members.read(organization, username)
        if(group.owner !== username && member === undefined){
            throw new Error("not authorized to perform this action")
        }
        const members = (await Repository.group_members.readAll(organization, filter, offset, limit)).map(member => {
            if(Date.now() - member.tags.timestamp >= TimePeriods.HOUR){
                member.tags.tagCount = 0
                member.tags.timestamp = Date.now()
            }
            Repository.group_members.update(organization, member)
            return member
        })
        return members
    },
    updateMember: async (ownerUsername: string, organization: string, memberUsername: string, permissions: UserPermissions, tagDescription: string, tagExpiration: number | null, tagGenerationLimit: number | null) => {
        const owner: User | undefined = await Repository.users.read(ownerUsername)
        const group: Group | undefined = await Repository.groups.read(organization)
        if(group === undefined){
            throw new Error("unauthorized")
        }
        
        const member: Member | undefined = await Repository.group_members.read(organization, memberUsername)
        const memberUpdatePermission: boolean = member?.permissions?.accounts?.UPDATE ?? false
        if(owner?.username !== group.owner && memberUpdatePermission !== true){
            throw new Error("not authorized to perform this action")
        }
        
        if(member === undefined){
            throw new Error("member not found")
        }

        member.permissions = permissions
        member.tagDescription = tagDescription
        member.tagExpiration = tagExpiration
        member.tags.tagGenerationLimit = tagGenerationLimit

        await Repository.group_members.update(organization, member)
    },
    deleteMember: async (ownerUsername: string, organization: string, member: string) => {
        const owner = await Repository.users.read(ownerUsername)
        const group: Group | undefined = await Repository.groups.read(organization)
        const memberInfo: Member | undefined = await Repository.group_members.read(organization, member)
        const memberDeletePermission = memberInfo?.permissions.accounts.DELETE ?? false
        if(owner?.username !== group?.owner && memberDeletePermission !== true){
            throw new Error("not authorized to perform this action")
        }
        await Repository.group_members.delete(organization, member)
    },
})