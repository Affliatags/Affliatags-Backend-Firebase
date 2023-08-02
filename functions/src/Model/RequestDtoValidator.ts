import Joi = require("joi")

export interface RequestDtoValidator {
    cookies: Joi.ObjectSchema<any> | null
    headers: Joi.ObjectSchema<any> | null
    params: Joi.ObjectSchema<any> | null
    body: Joi.ObjectSchema<any> | null
    query: Joi.ObjectSchema<any> | null
}