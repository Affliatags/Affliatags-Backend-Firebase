import { Environment } from "../Constants/environment"
import { JWT } from "../Model/JWT"
import { Member } from "../Model/Member"
import { Organization } from "../Model/Organization"
import { User } from "../Model/User"
import { UserPermissions } from "../Model/UserPermission"
import { Repository } from "../Repository/Repository"
import { memberValidations } from "../Util/validations/memberValidations"
import { organizationValidations } from "../Util/validations/organizationValidations"
import { userValidations } from "../Util/validations/userValidations"

export const MemberService = {
    addMember: async (jwt: JWT, member: Member): Promise<void> => {
        if(userValidations.username?.test(member.username) === false){
            throw new Error("invalid username provided")
        }
        if(organizationValidations.organization_name?.test(member.organization) === false){
            throw new Error("invalid organization name provided")
        }
        if(memberValidations.tag_description?.test(member.tag_description) === false){
            throw new Error("invalid tag description provided")
        }
        const organization: Organization = await Repository.organizations.read(member.organization)
        if(organization.owner === member.username){
            throw new Error("owner's username cannot be a member's username")
        }
        const totalMembers = await Repository.organization_members.readLength(member.organization)
        if(Object.keys(totalMembers).length >= Environment.getMaxMembersPerOrganization()){
            throw new Error("unable to add more members to this organization")
        }
        
        const currentMember: Member | undefined = await Repository.organization_members.read(organization.organization_name, member.username)
        if (organization.owner !== jwt.user && (currentMember === undefined || currentMember.permissions.accounts.CREATE === false)){
            throw new Error("not authorized to perform this action")
        }
        await Repository.organization_members.create(member.organization, member)
    },
    readMembers: async (jwt: JWT, organizatioName: string, filter: string, offset: number, limit: number): Promise<Array<Member>> => {
        const organization: Organization = await Repository.organizations.read(organizatioName)
        const member: Member | undefined = await Repository.organization_members.read(organizatioName, jwt.user)
        if(jwt.user !== organization.owner && member === undefined){
            throw new Error("not authorized to perform this action")
        }
        return await Repository.organization_members.readAll(organizatioName, filter, offset, limit)
    },
    updateMember: async (jwt: JWT, organizatioName: string, username: string, permissions: UserPermissions, tagDescription: string) => {
        const owner: User | undefined = await Repository.users.read(jwt.user)
        const organization: Organization = await Repository.organizations.read(organizatioName)
        const memberUpdatePermission: boolean = (await Repository.organization_members.read(organizatioName, jwt.user))?.permissions?.accounts?.UPDATE ?? false
        if(owner?.username !== organization.owner && memberUpdatePermission === false){
            throw new Error("not authorized to perform this action")
        }
        const member: Member | undefined = await Repository.organization_members.read(organizatioName, username)
        if(member === undefined){
            throw new Error("member not found")
        }
        member.permissions = permissions
        member.tag_description = tagDescription
        await Repository.organization_members.update(organizatioName, member)
    },
    deleteMember: async (jwt: JWT, organizatioName: string, member: string) => {
        const owner = await Repository.users.read(jwt.user)
        const organization = await Repository.organizations.read(organizatioName)
        const memberDeletePermission = (await Repository.organization_members.read(organizatioName, jwt.user))?.permissions.accounts.DELETE ?? false
        if(owner?.username !== organization.owner && memberDeletePermission === false){
            throw new Error("not authorized to perform this action")
        }
        await Repository.organization_members.delete(organizatioName, member)
    },
}