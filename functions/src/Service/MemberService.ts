import { Environment } from "../Constants/environment"
import { Member } from "../Model/Member"
import { Group } from "../Model/Group"
import { User } from "../Model/User"
import { UserPermissions } from "../Model/UserPermission"
import { Repository } from "../Repository/Repository"
import { memberValidations } from "../Util/validations/memberValidations"
import { userValidations } from "../Util/validations/userValidations"

export const MemberService = Object.freeze({
    addMember: async (ownerUsername: string, organization: string, member: Member): Promise<void> => {
        if(userValidations.username?.test(member.username) === false){
            throw new Error("invalid username provided")
        }
        if(memberValidations.tag_description?.test(member.tag_description) === false){
            throw new Error("invalid tag description provided")
        }
        const group: Group = await Repository.groups.read(organization)
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
        const group: Group = await Repository.groups.read(organization)
        const member: Member | undefined = await Repository.group_members.read(organization, username)
        if(group.owner !== username && member === undefined){
            throw new Error("not authorized to perform this action")
        }
        return await Repository.group_members.readAll(organization, filter, offset, limit)
    },
    updateMember: async (ownerUsername: string, organization: string, memberUsername: string, permissions: UserPermissions, tagDescription: string) => {
        const owner: User | undefined = await Repository.users.read(ownerUsername)
        const group: Group = await Repository.groups.read(organization)
        const member: Member | undefined = await Repository.group_members.read(organization, memberUsername)
        const memberUpdatePermission: boolean = member?.permissions?.accounts?.UPDATE ?? false
        if(owner?.username !== group.owner && memberUpdatePermission === false){
            throw new Error("not authorized to perform this action")
        }
        
        if(member === undefined){
            throw new Error("member not found")
        }
        member.permissions = permissions
        member.tag_description = tagDescription
        await Repository.group_members.update(organization, member)
    },
    deleteMember: async (ownerUsername: string, organization: string, member: string) => {
        const owner = await Repository.users.read(ownerUsername)
        const group: Group | undefined = await Repository.groups.read(organization)
        const memberInfo: Member | undefined = await Repository.group_members.read(organization, member)
        const memberDeletePermission = memberInfo?.permissions.accounts.DELETE ?? false
        if(owner?.username !== group?.owner && memberDeletePermission === false){
            throw new Error("not authorized to perform this action")
        }
        await Repository.group_members.delete(organization, member)
    },
})