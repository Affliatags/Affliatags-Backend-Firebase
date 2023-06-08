import { Environment } from "../../Constants/environment"
import { TimePeriods } from "../../Constants/TimePeroids"
import { Repository } from "../../Repository/Repository"


export const ipBlocker = async (req: any, res: any, next: any) => {
    const ipAddress: string = req.headers['x-forwarded-for'] || 
    req.connection.remoteAddress || 
    req.socket.remoteAddress ||
    req.connection.socket?.remoteAddress
    if(ipAddress === undefined){
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