import { Request } from "express"
import { RequestDtoValidator } from "../Model/RequestDtoValidator"

export const validateRequest = (req: Request, validator: RequestDtoValidator): {
    "params": Array<string>,
    "body": Array<string>,
    "query": Array<string>,
    "headers": Array<string>,
    "cookies": Array<string>,
} | null => {
    let errorDetected = false
    const errors = {
        "params": <Array<string>>[],
        "body": <Array<string>>[],
        "query": <Array<string>>[],
        "headers": <Array<string>>[],
        "cookies": <Array<string>>[],
    }
    for(const sectionValidator in validator){
        const sectionValidatorCasted = sectionValidator as "params" | "body" | "query" | "headers" | "cookies"
        if(validator[sectionValidatorCasted] !== null){
            const validationResult = validator[sectionValidatorCasted]!.validate((req as any)[sectionValidatorCasted], {
                abortEarly: false
            })
            if(validationResult.error !== undefined){
                errorDetected = true
                errors[sectionValidatorCasted] = validationResult.error.details.map(details => details.message)
            }
        }
    }
    return errorDetected ? errors : null
}