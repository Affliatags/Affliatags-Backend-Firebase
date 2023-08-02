import { routes } from "../Constants/routes"
import { Environment } from "../Constants/environment";
import { Application, Request, Response } from "express";
import { logger } from "../Util/logger";
import * as requestDTO from "../DTO/request"

export const ClientController = (app: Application) => {
    app.post(
        routes.checkClient,
        requestDTO.CheckClientDTO.Validator,
        async (req: Request, res: Response) => {
            try {
                const { body } = req as unknown as typeof requestDTO.CheckClientDTO.DTO
                const clientVersion: string = body.clientVersion
                if (clientVersion.split(".").join("") < Environment.getMinSupportedClientVersion().split(".").join("")) {
                    res.status(502).send({
                        status: "client is outdated"
                    })
                    return
                }
                res.status(200).send({
                    status: "client is compliant"
                })
            }
            catch (err) {
                const error: Error = err as Error
                switch (error.message) {
                    default:
                        logger(error.message)
                        res.status(500).send("internal server error")
                        break
                }
            }
        }
    )

    app.get(routes.open, async (req, res) => {
        // TODO: Serve PWA
        res.send("ok")
    })
}