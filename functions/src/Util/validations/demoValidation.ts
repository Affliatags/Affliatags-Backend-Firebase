import { NextFunction, Request, Response } from "express"
import { validateRequest } from "../validateRequest"

export const DemoValidatorAuth = async (req: Request, res: Response, next: NextFunction) => {
    const result = validateRequest(req, {
        cookies: null,
        headers: null,
        params: null,
        body: null,
        query: null,
    })
    if(result !== null){
        res.status(400).send(result)
        return
    }
    next()
}