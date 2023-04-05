import * as functions from "firebase-functions";
import * as dotenv from "dotenv"

export const Environment = Object.freeze({
    getFirebaseServiceAccountKey: (): {
        type: string
        project_id: string
        private_key_id: string
        private_key: string
        client_email: string
        client_id: string
        auth_uri: string
        token_uri: string
        auth_provider_x509_cert_url: string
        client_x509_cert_url: string
    } => {
        if(process.env.FUNCTIONS_EMULATOR !== "true"){
            return JSON.parse(Buffer.from(functions.config().environment.firebase_token, "base64").toString('utf-8'))
        }
        dotenv.config({
            path:"../.env"
        })
        return JSON.parse(Buffer.from(process.env.FIREBASE_TOKEN as string, "base64").toString('utf-8'))
    },
})