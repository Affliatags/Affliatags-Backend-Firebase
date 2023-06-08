import { describe } from "node:test"
// import { config } from "../fixtures/config"

describe("Organization Endpoint Suite", () => {

    it("Should not create an organization require if the user is not authenticated", () => {
        
    })
    
    it("Should be created given that the request has the correct fields with correct formatting", () => {
        // const response = await fetch(config.endpoints.auth, {
        //     body: JSON.stringify({
        //         username: user.username,
        //         password: user.password,
        //     }),
        //     headers: {
        //         "Content-Type": "application/json" 
        //     },
        //     method: "POST"
        // })
    })

    it("Should not respond with an organization given that the user is not authenticated", () => {
        
    })

    it("Should respond with an organization given that the user is authenticated", () => {
        
    })

    it("Should fail to create an organization and return regex given that the formatting for an organization name in the request body is incorrect", () => {
        
    })

    it("Should fail to create an organization given that the organization already exists", () => {
        
    })

    it("Should require captcha if ...", () => {
        
    })
})