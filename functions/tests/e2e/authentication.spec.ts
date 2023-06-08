import * as assert from "assert"
import { user } from "../fixtures/user"
import { config } from "../fixtures/config"
import { describe } from "node:test"

describe("Authentication Endpoint Suite", () => {
    it("Should return auth token given that the correct user credentials are provided", async () => {
        const response = await fetch(config.endpoints.auth, {
            body: JSON.stringify({
                username: user.username,
                password: user.password,
            }),
            headers: {
                "Content-Type": "application/json" 
            },
            method: "POST"
        })
        const responseJSON: {token: string} = await response.json()
        assert.equal(typeof(responseJSON.token), "string")
    }).timeout(5000)

    it("Should return unauthorized response given that the incorrect user credentials are provided", async () => {
        const response = await fetch(config.endpoints.auth, {
            body: JSON.stringify({
                username: user.username,
                password: user.password+"1",
            }),
            headers: {
                "Content-Type": "application/json" 
            },
            method: "POST"
        })
        const responseBodyParsed: string = await response.text()
        assert.equal(responseBodyParsed, "invalid credentials")
    }).timeout(5000)

    it("Should return regex given that the username has an invalid syntax", async () => {
        const response = await fetch(config.endpoints.auth, {
            body: JSON.stringify({
                username: " ",
                password: user.password,
            }),
            headers: {
                "Content-Type": "application/json" 
            },
            method: "POST"
        })
        const responseBodyParsed: string = await response.text()
        assert.notEqual(responseBodyParsed.indexOf("/^"), -1)
    }).timeout(5000)

    it("Should return regex given that the password has an invalid syntax", async () => {
        const response = await fetch(config.endpoints.auth, {
            body: JSON.stringify({
                username: user.username,
                password: " ",
            }),
            headers: {
                "Content-Type": "application/json" 
            },
            method: "POST"
        })
        const responseBodyParsed: string = await response.text()
        assert.notEqual(responseBodyParsed.indexOf("/^"), -1)
    }).timeout(5000)
})