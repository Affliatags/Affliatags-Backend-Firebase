import Joi = require("joi");
import { memberValidations } from "../../Util/validations/memberValidations";
import { groupValidations } from "../../Util/validations/groupValidations";
import { validateRequest } from "../../Util/validateRequest";
import { NextFunction, Request, Response } from "express";


export module GenerateTagDTO {
    export const DTO = {
        headers: {
            authorization: <string>"",
        },
        params: {
            organization: <string>"",
        },
        body: {
            description: <string>"",
            captchaResponse: <string | null>null,
            expiration: <number | null>null,
        },
        query: {},
        cookies: {},
    }

    const headers: Record<keyof typeof DTO.headers, Joi.Schema<any> | null> = {
        authorization: Joi.string(),
    }

    const params: Record<keyof typeof DTO.params, Joi.Schema<any> | null> = {
        organization: Joi.string().regex(groupValidations.organization as RegExp),
    }

    const body: Record<keyof typeof DTO.body, Joi.Schema<any> | null> = {
        description: Joi.string().regex(memberValidations.tagDescription as RegExp),
        captchaResponse: Joi.string().length(100).allow(null),
        expiration: Joi.number().max(1.578e+11).min(0).allow(null),
    }
    export const Validator = async (req: Request, res: Response, next: NextFunction) => {
        const result = validateRequest(req, {
            cookies: null,
            headers: Joi.object(headers),
            params: Joi.object(params),
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

