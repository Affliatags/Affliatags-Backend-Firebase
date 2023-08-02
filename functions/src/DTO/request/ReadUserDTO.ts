import Joi = require("joi");
import { userValidations } from "../../Util/validations/userValidations";
import { NextFunction, Request, Response } from "express";
import { validateRequest } from "../../Util/validateRequest";

export module ReadUserDTO {
    export const DTO = {
        headers: {},
        params: {
            user: <string>""
        },
        body: {},
        query: {},
        cookies: {},
    }

    const params: Record<keyof typeof DTO.params, Joi.Schema<any> | null> = {
        user: Joi.string().regex(userValidations.username as RegExp)
    }

    export const Validator = async (req: Request, res: Response, next: NextFunction) => {
        const result = validateRequest(req, {
            cookies: null,
            headers: null,
            params: Joi.object(params),
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

