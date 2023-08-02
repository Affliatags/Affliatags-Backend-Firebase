import Joi = require("joi");
import { groupValidations } from "../../Util/validations/groupValidations";
import { validateRequest } from "../../Util/validateRequest";
import { NextFunction, Request, Response } from "express";


export module VerifyTagDTO {
    export const DTO = {
        headers: {
            authorization: <string>"",
        },
        params: {
            tag: <string>"",
            organization: <string>"",
        },
        body: {},
        query: {},
        cookies: {},
    }

    const headers: Record<keyof typeof DTO.headers, Joi.Schema<any> | null> = {
        authorization: Joi.string(),
    }

    const params: Record<keyof typeof DTO.params, Joi.Schema<any> | null> = {
        tag: Joi.string().length(100),
        organization: Joi.string().regex(groupValidations.organization as RegExp),
    }

    export const Validator = async (req: Request, res: Response, next: NextFunction) => {
        const result = validateRequest(req, {
            cookies: null,
            headers: Joi.object(headers),
            params: Joi.object(params),
            body: null,
            query: null,
        })
        if(result !== null){
            res.status(400).send(result)
            return
        }
        next()
    }
}

