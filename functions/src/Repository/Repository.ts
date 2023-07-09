import { Environment } from "../Constants/environment";
import { Group } from "../Model/Group";
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

    groups: {
        create: async (group: Group): Promise<string> => {
            await db.collection("groups").doc(group.organization).set(group)
            return ""
        },
        read: async (organization: string): Promise<Group | undefined> => {
            const group = (await db.collection("groups").doc(organization).get()).data() as Group | undefined
            return group  
        },
        readOwnerGroups: async (owner: string): Promise<Array<Group>> => {
            const groupSnapshots =  await db.collection("groups").where("owner", "==", owner).orderBy("organization").get()
            const result: Array<Group> = []
            groupSnapshots.docs.forEach(doc => {
                const docData = doc.data() as Group
                result.push(docData)
            })
            return result
        },
        readOwnerGroupsLength: async (owner: string): Promise<number> => {
            const groupSnapshots =  await db.collection("groups")
            .where("owner", "==", owner)
            .count()
            .get()

            return groupSnapshots.data().count
        },
        update: async (organization: string, group: Group): Promise<void> => {
            const groupObj = (await db.collection("groups").doc(organization).get()).data() as Group | undefined
            if(groupObj !== undefined){
                await db.collection("groups").doc(group.organization).set(group)
            }
        },
        delete: async (organization: string): Promise<void> => {
            await db.collection("groups").doc(organization).delete()
        },
    },

    group_members: {
        create: async (organization: string, member: Member): Promise<string> => {
            await db.collection("group_members").doc(organization).collection(organization).doc(member.username).set(member)
            return member.username
        },
        read: async (organization: string, member: string): Promise<Member | undefined> => {
            return (await db.collection("group_members").doc(organization).collection(organization).doc(member).get()).data() as Member | undefined
        },
        readAll: async (organization: string, filter: string, offset: number, limit: number = 30): Promise<Array<Member>> => {
            if(limit <= 0 || limit > 30){
                limit = 30
            }
            if(offset < 0){
                offset = 0
            }
            const membersSnapshot = await db.collection("group_members")
                .doc(organization)
                .collection(organization)
                .offset(offset).limit(limit)
                .where("username", ">=", filter)
                .where("username", "<=", filter + "\uf8ff")
                .orderBy("username")
                .get()
            const result: Array<Member> = []
            membersSnapshot.docs.forEach(doc => {
                const docData = doc.data() as Member
                result.push(docData)
            })
            return result
        },
        readLength: async (organization: string): Promise<number> => {
            const snapshot = await db.collection("group_members")
                .doc(organization)
                .collection(organization)
                .count()
                .get()

            return snapshot.data().count
        },
        update: async (organization: string, member: Member) =>  {
            await db.collection("group_members").doc(organization).collection(organization).doc(member.username).set(member)
        },
        delete: async (organization: string, member: string) =>  {
            await db.collection("group_members").doc(organization).collection(organization).doc(member).delete()
        },
    },

    tags: {
        create: async (organization: string, tag: Tag): Promise<string> => {
            let tags = (await db.collection("tags").doc(organization).get()).data() as Record<string, Tag>
            tags = {
                ...tags,
                [tag.token]: tag
            }
            await db.collection("tags").doc(organization).set(tags)
            await db.collection("tags").doc(organization).collection(tag.token).doc(tag.token).set(tag)
            return tag.token
        },
        read: async (organization: string, token: string): Promise<Tag | undefined> => {
            return (await db.collection("tags").doc(organization).collection(token).doc(token).get()).data() as any
        },
        readAll: async (organization: string): Promise<Record<string, Tag>> => {
            const tags = (await db.collection("tags").doc(organization).get()).data() as Record<string, Tag>
            return { ...tags }
        },
        delete: async (organization: string, token: string): Promise<void> => {
            const tags = (await db.collection("tags").doc(organization).get()).data() as Record<string, Tag>
            delete tags[token]
            await db.collection("tags").doc(organization).set(tags)
            await db.collection("tags").doc(organization).collection(token).doc(token).delete()
        },
        deleteOutdatedTagsFromIndexer: async (organization: string, tags: Array<string>) => {
            const docRef = await db.collection("tags").doc(organization)
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
        read: async (ipAddress: string): Promise<{requestCount: number, timestamp: number} | undefined> => {
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