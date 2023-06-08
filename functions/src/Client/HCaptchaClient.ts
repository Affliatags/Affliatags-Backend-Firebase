import { Environment } from "../Constants/environment"

export const HCaptchaClient = Object.freeze({

    /**
     * Docs: https://docs.hcaptcha.com/#verify-the-user-response-server-side
     * @param clientResponse 
     */
    verifyCaptcha: async (clientResponse: string): Promise<boolean> => {
        const response = await fetch("https://hcaptcha.com/siteverify", {
            "method": "POST",
            "body": JSON.stringify({
                response: clientResponse,
                secret: Environment.getHCaptchaSecret(),
            })
        })

        const responseJSON: {success: boolean, challenge_ts: string} = await response.json()
        return responseJSON.success
    }

})