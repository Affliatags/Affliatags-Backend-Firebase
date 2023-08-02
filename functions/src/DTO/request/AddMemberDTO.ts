import Joi = require("joi");
import { NextFunction, Request, Response } from "express";
import { validateRequest } from "../../Util/validateRequest";
import { groupValidations } from "../../Util/validations/groupValidations";
import { UserPermissions } from "../../Model/UserPermission";
import { memberValidations } from "../../Util/validations/memberValidations";

export module AddMemberDTO {
    export const DTO = {
        headers: {
            authorization: <string>""
        },
        params: {
            organization: <string>""
        },
        body: {
            username: <string>"",
            permissions: <UserPermissions>{
                accounts: {
                    CREATE: false,
                    READ: false,
                    UPDATE: false,
                    DELETE: false,
                },
                allowGenerateTags: true,
                allowScanTags: false,
                tagsPerHour: null
            },
            tagDescription: <string>"",
            tagExpiration: <number | null>0,
            tagGenerationLimit: <number | null>0,
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
        username: Joi.string().regex(memberValidations.username as RegExp),
        tagDescription: Joi.string().regex(memberValidations.tagDescription as RegExp),
        permissions: Joi.object({
            accounts: Joi.object({
                CREATE: Joi.boolean(),
                READ: Joi.boolean(),
                UPDATE: Joi.boolean(),
                DELETE: Joi.boolean(),
            }),
            allowGenerateTags: Joi.boolean(),
            allowScanTags: Joi.boolean(),
            tagsPerHour: Joi.number().allow(null),
        }),
        tagExpiration: Joi.number().allow(null).min(1000).max(9999999999999),
        tagGenerationLimit: Joi.number().allow(null),
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