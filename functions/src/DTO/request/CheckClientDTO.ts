import Joi = require("joi");
import { validateRequest } from "../../Util/validateRequest";
import { NextFunction, Request, Response } from "express";


export module CheckClientDTO {
    export const DTO = {
        headers: {},
        params: {},
        body: {
            clientVersion: <string>""
        },
        query: {},
        cookies: {},
    }

    const body: Record<keyof typeof DTO.body, Joi.Schema<any> | null> = {
        clientVersion: Joi.string().regex(/^[0-9]{1,2}.[0-9]{1,2}.[0-9]{1,2}$/)
    }

    export const Validator = async (req: Request, res: Response, next: NextFunction) => {
        const result = validateRequest(req, {
            cookies: null,
            headers: null,
            params: null,
            body: Joi.object(body),
            query: null,
        })
        if(result !== null){
            res.status(400).send(result)
            return
        }
        next()
    }
}

