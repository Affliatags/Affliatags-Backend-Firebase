const apiRootEndpoint: string = "http://127.0.0.1:3000/qr-id-2133c/us-central1/api/api"

export const config = {
    endpoints: {
        auth: apiRootEndpoint+"/auth",
        addMember: apiRootEndpoint
    }
}