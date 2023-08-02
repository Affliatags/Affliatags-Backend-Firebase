import * as express from "express"
import { RequestDtoValidator } from "../Model/RequestDtoValidator"
import { validateRequest } from "./validateRequest"

/**
 * requestHandler : A custom request handler function featuring Joi validation support
 * 
 * @param app 
 * @param route 
 * @param requestType 
 * @param validator 
 * @param callback 
 * */
export const requestHandler = (
    app: express.Express,
    route: string,
    requestType: "get" | "post" | "put" | "delete",
    validator: RequestDtoValidator,
    ...callback: Array<(req: express.Request, res: express.Response) => Promise<void>>
) => {
    let validationErrorDetected = false
    app[requestType](route, async (req, res, next) => {
        const result = validateRequest(req, validator)
        if(result !== null){
            res.status(400).send(result)
            return
        }
        next()
    }, async (req, res) => {
        if(validationErrorDetected === false){
            for(const cb of callback){
                await cb(req, res)
            }
        }
    })
}