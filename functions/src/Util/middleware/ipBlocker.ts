import { NextFunction, Request, Response } from "express"
import { Environment } from "../../Constants/environment"
import { TimePeriods } from "../../Constants/TimePeroids"
import { Repository } from "../../Repository/Repository"


export const ipBlocker = async (req: Request, res: Response, next: NextFunction) => {
    const ipAddress: string | undefined = 
    req.ip || 
    req.socket.remoteAddress || 
    req.socket.remoteAddress
    if(ipAddress === undefined || req.headers['x-forwarded-for'] !== undefined){
        next()
        return
    }

    let ipAddressDetails = await Repository.ip.read(ipAddress)
    if(ipAddressDetails === undefined || Date.now() - ipAddressDetails.timestamp >= TimePeriods.HOUR){
        ipAddressDetails = {
            requestCount: 0,
            timestamp: Date.now()
        }
    }

    if(ipAddressDetails.requestCount >= Environment.getMaxRequestsPerHour() && Date.now() - ipAddressDetails.timestamp < TimePeriods.HOUR) {
        res.status(403).send("too many requests, please try again later")
        return
    }

    ipAddressDetails.requestCount += 1
    await Repository.ip.update(ipAddress, ipAddressDetails)

    next()
}