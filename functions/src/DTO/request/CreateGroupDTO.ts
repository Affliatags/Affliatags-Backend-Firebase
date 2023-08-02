import Joi = require("joi");
import { groupValidations } from "../../Util/validations/groupValidations";
import { validateRequest } from "../../Util/validateRequest";
import { NextFunction, Request, Response } from "express";


export module CreateGroupDTO {
    export const DTO = {
        headers: {
            authorization: <string>"",
        },
        params: {},
        body: {
            organization: <string>"",
            captchaResponse: <string | null>null,
        },
        query: {},
        cookies: {},
    }

    const headers: Record<keyof typeof DTO.headers, Joi.Schema<any> | null> = {
        authorization: Joi.string(),
    }

    const body: Record<keyof typeof DTO.body, Joi.Schema<any> | null> = {
        organization: Joi.string().regex(groupValidations.organization as RegExp),
        captchaResponse: Joi.string().length(100).allow(null),
    }

    export const Validator = async (req: Request, res: Response, next: NextFunction) => {
        const result = validateRequest(req, {
            cookies: null,
            headers: Joi.object(headers),
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