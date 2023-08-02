import Joi = require("joi");
import { groupValidations } from "../../Util/validations/groupValidations";
import { validateRequest } from "../../Util/validateRequest";
import { NextFunction, Request, Response } from "express";
import * as valid from "card-validator"

export module PremiumDTO {
    export const DTO = {
        headers: {
            authorization: <string>"",
        },
        params: {
            organization: <string>"",
        },
        body: {
            duration: <number>0,
            cardDetails: {
                cardholderName: "",
                cardNumber: "",
                cvv: "",
                expirationMonth: 1,
                expirationYear: 0,
            },
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
        duration: Joi.number(),
        cardDetails: Joi.object({
            cardholderName: Joi.string().custom((value, helper) => {
                if(valid.cardholderName(value).isPotentiallyValid === false){
                    return helper.message({
                        "error": "invalid cardholder name provided"
                    })
                }
                return true
            }),
            cardNumber: Joi.string().min(8).max(19).custom((value, helper) => {
                if(valid.number(value).isPotentiallyValid === false){
                    return helper.message({
                        "error": "invalid card number provided"
                    })
                }
                return true
            }),
            cvv: Joi.string().min(3).max(4).custom((value, helper) => {
                if(valid.cvv(value).isPotentiallyValid === false){
                    return helper.message({
                        "error": "invalid cvv provided"
                    })
                }
                return true
            }),
            expirationMonth: Joi.number().integer().min(1).max(12).custom((value, helper) => {
                if(valid.expirationMonth(String(value)).isPotentiallyValid === false){
                    return helper.message({
                        "error": "invalid expiration month provided"
                    })
                }
                return true
            }),
            expirationYear: Joi.number().custom((value, helper) => {
                if(valid.expirationYear(String(value)).isPotentiallyValid === false){
                    return helper.message({
                        "error": "invalid expiration year provided"
                    })
                }
                return true
            }),
        }),
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

