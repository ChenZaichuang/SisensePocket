// import { tmpDashboardJson } from './constant.js';
// import { sendGetRequest, sendPostRequest } from './sisense_client.js';

// const {tmpDashboardJson} = require("./constant");

function trimObject(anObject) {
    for (let key in anObject) {
        if (typeof anObject[key] === 'string') {
            anObject[key] = anObject[key].trim();
        }
    }
}

async function getUserGroupManager(host, authCookie) {
    if (UserGroupManager.instance) {
        return UserGroupManager.instance;
    }
    const instance = new UserGroupManager(host, authCookie);
    await instance.getGroupUserInfo();
    UserGroupManager.instance = instance;
    return instance;
}

class UserGroupManager {
    static instance = null;

    constructor(host, authCookie) {
        this.host = host;
        this.authCookie = authCookie;
        this.userInfoList;
        this.userInfoMap = new Map();
        this.groupInfoMap = new Map();
        this.userGroupMap = new Map();
        this.groupUserMap = new Map();
    }


    async getGroupUserInfo() {
        let [groupInfoList, newDashboards] = await Promise.all(
            [
                sendGetRequest(this.host, 'api/v1/groups', this.authCookie),
                sendPostRequest(this.host, 'api/v1/dashboards/import/bulk?action=overwrite', tmpDashboardJson, this.authCookie, true)
            ]
        );
        const userInfoListPromise = await sendGetRequest(this.host, 'api/v1/users', this.authCookie);
        const newDashboard = newDashboards['succeded'][0];
        const dashboardId = newDashboard['oid'];
        const initShares = newDashboard['shares'];
        initShares[0]['subscribe'] = false;

        for (const group of groupInfoList) {

            trimObject(group);

            initShares.push({
                shareId: group['_id'],
                type : "group",
                subscribe: false
            });
            this.groupInfoMap.set(group['_id'], group);
        }

        const dashboardSharingPayload = JSON.stringify({
            'sharesTo': initShares
        })
        await sendPostRequest(this.host, `api/shares/dashboard/${dashboardId}`, dashboardSharingPayload, this.authCookie, false);
        const currentDashboardPermission = await sendGetRequest(this.host, `api/v1/dashboards/${dashboardId}/shares?expand=user(fields:userName),group.users(fields:userName)`, this.authCookie);
        sendDeleteRequest(this.host, `api/dashboards/${dashboardId}`, this.authCookie);

        this.userInfoList = await userInfoListPromise;
        for (const user of this.userInfoList) {
            trimObject(user);
            this.userInfoMap.set(user['_id'], user);
        }

        for (const share of currentDashboardPermission) {
            if (share["type"] !== 'group') {
                continue
            }
            const groupId = share['group']['_id']
            for (const user of share['group']['users']) {
                const userId = user['_id'];

                if (!this.userGroupMap.has(userId)) {
                    this.userGroupMap.set(userId, []);
                }
                this.userGroupMap.get(userId).push(this.groupInfoMap.has(groupId) ? this.groupInfoMap.get(groupId) : {"_id": groupId, "name": `Unknown Group: ${groupId}`});

                if (!this.groupUserMap.has(groupId)) {
                    this.groupUserMap.set(groupId, []);
                }
                this.groupUserMap.get(groupId).push(this.userInfoMap.has(userId) ? this.userInfoMap.get(userId) : {"_id": userId, "firstName": `Unknown firstName: ${userId}`, "lastName": `Unknown lastName: ${userId}`, "userName": `Unknown userName: ${userId}`, "email": `Unknown email: ${userId}`});
            }
        }

    }

    getUserById(userId) {
        return this.userInfoMap.has(userId) ? this.userInfoMap.get(userId) : {"_id": userId, "firstName": `Unknown firstName: ${userId}`, "lastName": `Unknown lastName: ${userId}`, "userName": `Unknown userName: ${userId}`, "email": `Unknown email: ${userId}`};
    }

    getGroupById(groupId) {
        return this.groupInfoMap.has(groupId) ? this.groupInfoMap.get(groupId) : {"_id": groupId, "name": `Unknown Group: ${groupId}`};
    }

    getGroupsOfUser(userId) {
        return this.userGroupMap.has(userId) ? this.userGroupMap.get(userId) : [];
    }

    getUsersOfGroup(groupId) {
        return this.groupUserMap.has(groupId) ? this.groupUserMap.get(groupId) : [];
    }

    getAllUsers() {
        return this.userInfoList;
    }

}
