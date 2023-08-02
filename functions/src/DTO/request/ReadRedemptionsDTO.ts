import Joi = require("joi");
import { NextFunction, Request, Response } from "express";
import { validateRequest } from "../../Util/validateRequest";
import { groupValidations } from "../../Util/validations/groupValidations";

export module ReadRedemptionsDTO {
    export const DTO = {
        headers: {
            authorization: <string>""
        },
        params: {
            organization: <string>"",
        },
        body: {
            monthsAgo: <0 | 1 | 2 | 3>0,
        },
        query: {
            filter: <string>"",
            offset: <number>0,
            limit: <number>0,
        },
        cookies: {},
    }

    const params: Record<keyof typeof DTO.params, Joi.Schema<any> | null> = {
        organization: Joi.string().regex(groupValidations.organization as RegExp),
    }

    const headers: Record<keyof typeof DTO.headers, Joi.Schema<any> | null> = {
        authorization: Joi.string()
    }

    const body: Record<keyof typeof DTO.body, Joi.Schema<any> | null> = {
        monthsAgo: Joi.number().integer().min(0).max(3),
    }

    const query: Record<keyof typeof DTO.query, Joi.Schema<any> | null> = {
        filter: Joi.number(),
        offset: Joi.number(),
        limit: Joi.number(),
    }

    export const Validator = async (req: Request, res: Response, next: NextFunction) => {
        const result = validateRequest(req, {
            cookies: null,
            headers: Joi.object(headers),
            params: Joi.object(params),
            body: Joi.object(body),
            query: Joi.object(query),
        })
        if(result !== null){
            res.status(400).send(result)
            return
        }
        next()
    }
}