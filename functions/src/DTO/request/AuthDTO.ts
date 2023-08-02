import Joi = require("joi");
import { userValidations } from "../../Util/validations/userValidations";
import { validateRequest } from "../../Util/validateRequest";
import { NextFunction, Request, Response } from "express";

export namespace AuthDTO {
    export const DTO = {
        headers: {},
        params: {},
        body: {
            username: <string>"",
            password: <string>"",
        },
        query: {},
        cookies: {},
    }

    const body: Record<keyof typeof DTO.body, Joi.Schema<any> | null> = {
        username: Joi.string().regex(userValidations.username as RegExp),
        password: Joi.string().regex(/^(?=.*[A-Z])/).regex(/^(?=.*[a-z])/).regex(/^(?=.*[@$!%*#?&])/),
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