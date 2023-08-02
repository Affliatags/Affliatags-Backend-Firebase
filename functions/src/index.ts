import { validateJWT } from "./Util/middleware/validateJWT";
import { ipBlocker } from "./Util/middleware/ipBlocker";
import { UserController } from "./Controller/UserController";
import { ClientController } from "./Controller/ClientController";
import { GroupController } from "./Controller/GroupController";
import { MemberController } from "./Controller/MemberController";
import { PremiumController } from "./Controller/PremiumController";
import { RedemptionController } from "./Controller/RedemptionController";
import { TagController } from "./Controller/TagController";
import * as functions from "firebase-functions";
import * as express from "express"

const app = express()
app.use(express.json({
    limit: 1000000
}))
app.all("*", ipBlocker)
app.all("*", validateJWT)

ClientController(app)
UserController(app)
GroupController(app)
MemberController(app)
TagController(app)
RedemptionController(app)
PremiumController(app)

exports.api = functions.https.onRequest(app)