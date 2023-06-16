
const apiPrefix = "/api"
export const routes = Object.freeze({
    auth: apiPrefix + "/auth",
    createGroup: apiPrefix + "/groups",
    readGroup: apiPrefix + "/groups/:organization",
    readGroups: apiPrefix + "/groups",
    generateTag: apiPrefix + "/tags/:organization/generate",
    verifyTag: apiPrefix + "/tags/:organization/verify/:tag",
    verifyTagWeb: apiPrefix + "/tags/:organization/verifyweb/:tag",
    premium: apiPrefix + "/groups/:organization/premium",
    addMember: apiPrefix + "/groups/:organization/members",
    updateMember: apiPrefix + "/groups/:organization/members/:member",
    readMembers: apiPrefix + "/groups/:organization/members",
    deleteMember: apiPrefix + "/groups/:organization/members/:member",
    deals: apiPrefix + "/deals",
    getLatestAppVersion: "/latestAppVersion",
    addGroupInstagram: apiPrefix + "/groups/:organization/instagram" 
})