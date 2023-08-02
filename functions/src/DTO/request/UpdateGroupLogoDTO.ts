import Joi = require("joi");
import { NextFunction, Request, Response } from "express";
import { validateRequest } from "../../Util/validateRequest";
import { groupValidations } from "../../Util/validations/groupValidations";

export module UpdateGroupLogoDTO {
    export const DTO = {
        headers: {
            authorization: <string>""
        },
        params: {
            organization: <string>""
        },
        body: {
            logo: <string>""
        },
        query: {},
        cookies: {},
    }

    const params: Record<keyof typeof DTO.params, Joi.Schema<any> | null> = {
        organization: Joi.string().regex(groupValidations.organization as RegExp)
    }

    const headers: Record<keyof typeof DTO.headers, Joi.Schema<any> | null> = {
        authorization: Joi.string()
    }

    const body: Record<keyof typeof DTO.body, Joi.Schema<any> | null> = {
        logo: Joi.string().regex(groupValidations.organization as RegExp)
    }

    export const Validator = async (req: Request, res: Response, next: NextFunction) => {
        const result = validateRequest(req, {
            cookies: null,
            headers: Joi.object(headers),
            params: Joi.object(params),
            body: Joi.object(body),
            query: null
        })
        if(result !== null){
            res.status(400).send(result)
            return
        }
        next()
    }
}

