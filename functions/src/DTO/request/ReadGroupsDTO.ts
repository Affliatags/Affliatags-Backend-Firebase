import Joi = require("joi");
import { NextFunction, Request, Response } from "express";
import { validateRequest } from "../../Util/validateRequest";

export module ReadGroupsDTO {
    export const DTO = {
        headers: {
            authorization: <string>""
        },
        params: {},
        body: {},
        query: {},
        cookies: {},
    }

    const headers: Record<keyof typeof DTO.headers, Joi.Schema<any> | null> = {
        authorization: Joi.string()
    }

    export const Validator = async (req: Request, res: Response, next: NextFunction) => {
        const result = validateRequest(req, {
            cookies: null,
            headers: Joi.object(headers),
            params: null,
            body: null,
            query: null
        })
        if(result !== null){
            res.status(400).send(result)
            return
        }
        next()
    }
}