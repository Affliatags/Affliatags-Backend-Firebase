import { Environment } from "../Constants/environment";
import { Organization } from "../Model/Organization";
import { User } from "../Model/User";
import { Tag } from "../Model/Tag";
import { Member } from "../Model/Member";
import * as admin from "firebase-admin"
import * as firestore from 'firebase-admin/firestore'

admin.initializeApp({ credential: admin.credential.cert(Environment.getFirebaseServiceAccountKey() as object) })
const db = firestore.getFirestore()

export const Repository = Object.freeze({

    users: <Table<User>>{
        create: async (user: User): Promise<string> => {
            await db.collection("users").doc(user.username).set(user)
            return ""
        },
        read: async (username: string): Promise<User | undefined> => {
            const user = (await db.collection("users").doc(username).get()).data() as User | undefined
            return user
        },
    },

    organizations: <Table<Organization>>{
        create: async (organization: Organization): Promise<string> => {
            const org: any = organization
            delete org["members"]
            await db.collection("organizations").doc(organization.organization_name).set(org)
            await db.collection("organization_members").doc(organization.organization_name).set({})
            return ""
        },
        read: async (organizationName: string): Promise<Organization> => {
            const organization = (await db.collection("organizations").doc(organizationName).get()).data() as Organization | undefined
            if(organization === undefined){
                throw new Error("organization was not found")
            }
            return organization  
        },
        update: async (organizationName: string, organization: Organization): Promise<void> => {
            const organizationObj = (await db.collection("organizations").doc(organizationName).get()).data() as Organization | undefined
            const members = (await db.collection("organization_members").doc(organizationName).get()).data() as Record<string, boolean> | undefined
            if(organizationObj === undefined || members === undefined){
                throw new Error("organization or members object was not found")
            }
            const org: any = organization
            delete org["members"]

            await db.collection("organizations").doc(organization.organization_name).set(org)
            await db.collection("organization_members").doc(organization.organization_name).set(members)
        },
        delete: async (organizationName: string): Promise<void> => {
            await db.collection("organizations").doc(organizationName).delete()
        },
    },

    organization_members: {
        create: async (organizationName: string, member: Member): Promise<string> => {
            await db.collection("organization_members").doc(organizationName).collection(organizationName).doc(member.username).set(member)
            return member.username
        },
        read: async (organizationName: string, member: string): Promise<Member | undefined> => {
            return (await db.collection("organization_members").doc(organizationName).collection(organizationName).doc(member).get()).data() as Member | undefined
        },
        readAll: async (organizationName: string, filter: string, offset: number, limit: number = 30): Promise<Array<Member>> => {
            if(limit <= 0 || limit > 30){
                limit = 30
            }
            if(offset < 0){
                offset = 0
            }
            const membersSnapshot = await db.collection("organization_members")
                .doc(organizationName)
                .collection(organizationName)
                .offset(offset).limit(limit)
                .where("username", ">=", filter)
                .where("username", "<=", filter + "\uf8ff")
                .get()
            const result: Array<Member> = []
            membersSnapshot.docs.forEach(doc => {
                const docData = doc.data() as Member
                result.push(docData)
            })
            return result
        },
        readLength: async (organizationName: string): Promise<number> => {
            const snapshot = await db.collection("organization_members")
                .doc(organizationName)
                .collection(organizationName)
                .count()
                .get()

            return snapshot.data().count
        },
        update: async (organizationName: string, member: Member) =>  {
            await db.collection("organization_members").doc(organizationName).collection(organizationName).doc(member.username).set(member)
        },
        delete: async (organizationName: string, member: string) =>  {
            await db.collection("organization_members").doc(organizationName).collection(organizationName).doc(member).delete()
        },
    },

    tags: {
        create: async (organizationName: string, tag: Tag): Promise<string> => {
            let tags = (await db.collection("tags").doc(organizationName).get()).data() as Record<string, Tag>
            tags = {
                ...tags,
                [tag.token]: tag
            }
            await db.collection("tags").doc(organizationName).set(tags)
            await db.collection("tags").doc(organizationName).collection(tag.token).doc(tag.token).set(tag)
            return tag.token
        },
        read: async (organizationName: string, token: string): Promise<Tag | undefined> => {
            return (await db.collection("tags").doc(organizationName).collection(token).doc(token).get()).data() as any
        },
        readAll: async (organizationName: string): Promise<Record<string, Tag>> => {
            const tags = (await db.collection("tags").doc(organizationName).get()).data() as Record<string, Tag>
            return { ...tags }
        },
        delete: async (organizationName: string, token: string): Promise<void> => {
            const tags = (await db.collection("tags").doc(organizationName).get()).data() as Record<string, Tag>
            delete tags[token]
            await db.collection("tags").doc(organizationName).set(tags)
            await db.collection("tags").doc(organizationName).collection(token).doc(token).delete()
        },
        deleteOutdatedTagsFromIndexer: async (organizationName: string, tags: Array<string>) => {
            const docRef = await db.collection("tags").doc(organizationName)
            for(const tag of tags){
                await docRef.update({
                    [tag]: firestore.FieldValue.delete()
                })
            }
        },        
    },

    ip: {
        create: async (ipAddress: string) => {
            await db.collection("ip").doc(ipAddress).set({
                requestCount: 1,
                timestamp: Date.now()
            })
        },
        read: async (ipAddress: string): Promise<{requestCount: number, timestamp: number}> => {
            return (await db.collection("ip").doc(ipAddress).get()).data() as {requestCount: number, timestamp: number}
        },
        update: async (ipAddress: string, ipAddressDetails: {
            requestCount: number;
            timestamp: number;
        }) => {
            await db.collection("ip").doc(ipAddress).set(ipAddressDetails)
        },
        delete: async (ipAddress: string) => {
            await db.collection("ip").doc(ipAddress).delete()
        },
    }
})

interface Table<T> {
    create(item: T): Promise<string>
    read(id: string): Promise<T>
    readAll(filter: string): Promise<Array<T>>
    update(id: string, item: T): Promise<void>
    delete(id: string): Promise<void>
}