import { Environment } from "../Constants/environment"
import { JWT } from "../Model/JWT"
import { Member } from "../Model/Member"
import { Group } from "../Model/Group"
import { User } from "../Model/User"
import { UserPermissions } from "../Model/UserPermission"
import { Repository } from "../Repository/Repository"
import { memberValidations } from "../Util/validations/memberValidations"
import { userValidations } from "../Util/validations/userValidations"

export const MemberService = Object.freeze({
    addMember: async (jwt: JWT, organization: string, member: Member): Promise<void> => {
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
        if (group.owner !== jwt.user && (currentMember === undefined || currentMember.permissions.accounts.CREATE === false)){
            throw new Error("not authorized to perform this action")
        }
        await Repository.group_members.create(organization, member)
    },
    readMembers: async (jwt: JWT, organizatioName: string, filter: string, offset: number, limit: number): Promise<Array<Member>> => {
        const group: Group = await Repository.groups.read(organizatioName)
        const member: Member | undefined = await Repository.group_members.read(organizatioName, jwt.user)
        if(jwt.user !== group.owner && member === undefined){
            throw new Error("not authorized to perform this action")
        }
        return await Repository.group_members.readAll(organizatioName, filter, offset, limit)
    },
    updateMember: async (jwt: JWT, organizatioName: string, username: string, permissions: UserPermissions, tagDescription: string) => {
        const owner: User | undefined = await Repository.users.read(jwt.user)
        const group: Group = await Repository.groups.read(organizatioName)
        const memberUpdatePermission: boolean = (await Repository.group_members.read(organizatioName, jwt.user))?.permissions?.accounts?.UPDATE ?? false
        if(owner?.username !== group.owner && memberUpdatePermission === false){
            throw new Error("not authorized to perform this action")
        }
        const member: Member | undefined = await Repository.group_members.read(organizatioName, username)
        if(member === undefined){
            throw new Error("member not found")
        }
        member.permissions = permissions
        member.tag_description = tagDescription
        await Repository.group_members.update(organizatioName, member)
    },
    deleteMember: async (jwt: JWT, organizatioName: string, member: string) => {
        const owner = await Repository.users.read(jwt.user)
        const group: Group | undefined = await Repository.groups.read(organizatioName)
        const memberDeletePermission = (await Repository.group_members.read(organizatioName, jwt.user))?.permissions.accounts.DELETE ?? false
        if(owner?.username !== group?.owner && memberDeletePermission === false){
            throw new Error("not authorized to perform this action")
        }
        await Repository.group_members.delete(organizatioName, member)
    },
})