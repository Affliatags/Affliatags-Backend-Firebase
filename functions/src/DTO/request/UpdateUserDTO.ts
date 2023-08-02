import Joi = require("joi");
import { userValidations } from "../../Util/validations/userValidations";
import { validateRequest } from "../../Util/validateRequest";
import { NextFunction, Request, Response } from "express";

export namespace UpdateUserDTO {
    export const DTO = {
        headers: {
            authorization: <string>"",
        },
        params: {},
        body: {
            profilePhoto: <string | null | undefined>"",
            password: <string | undefined>"",
        },
        query: {},
        cookies: {},
    }

    const headers: Record<keyof typeof DTO.headers, Joi.Schema<any> | null> = {
        authorization: Joi.string()
    }

    const body: Record<keyof typeof DTO.body, Joi.Schema<any> | null> = {
        profilePhoto: Joi.string().allow(null),
        password: Joi.string().regex(userValidations.password as RegExp).optional()
    }
    
    export const Validator = async (req: Request, res: Response, next: NextFunction) => {
        const result = validateRequest(req, {
            cookies: null,
            headers: Joi.object(headers),
            params: null,
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