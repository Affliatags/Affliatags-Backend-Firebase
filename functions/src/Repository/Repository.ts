import * as admin from "firebase-admin"
import * as firestore from 'firebase-admin/firestore'
import { Environment } from "../Constants/environment";
import { v4 as uuidv4 } from 'uuid';

admin.initializeApp({ credential: admin.credential.cert(Environment.getFirebaseServiceAccountKey() as object) })
const db = firestore.getFirestore()

export const Repository = {
    generateToken: async (username: string) => {
        const token: string = uuidv4()
        const result = await db.collection(username).add({
            [token]: true
        })
        return {
            docId: result.id,
            token
        }
    },

    fetchToken: async (username: string, docId: string): Promise<boolean> => {
        const documentData = (await (db.collection(username).doc(docId).get())).data()
        return documentData !== undefined
    },

    deleteToken: async (username: string, token: string): Promise<void> => {
        await db.collection(username).doc(token).delete()
    }
}