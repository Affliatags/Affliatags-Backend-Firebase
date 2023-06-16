
const apiPrefix = "/api"
export const routes = Object.freeze({
    auth: apiPrefix + "/auth",
    createGroup: apiPrefix + "/organization",
    readGroup: apiPrefix + "/organizations/:organization",
    readGroups: apiPrefix + "/organizations",
    generateTag: apiPrefix + "/tags/:organization/generate",
    verifyTag: apiPrefix + "/tags/:organization/verify/:tag",
    verifyTagWeb: apiPrefix + "/tags/:organization/verifyweb/:tag",
    premium: apiPrefix + "/organizations/:organization/premium",
    addMember: apiPrefix + "/organizations/:organization/members",
    updateMember: apiPrefix + "/organizations/:organization/members/:member",
    readMembers: apiPrefix + "/organizations/:organization/members",
    deleteMember: apiPrefix + "/organizations/:organization/members/:member",
    deals: apiPrefix + "/deals",
    getLatestAppVersion: "/latestAppVersion"
})