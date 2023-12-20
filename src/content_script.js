'use strict';

// import { UserGroupManager } from './sisense_data.js';
// import { createParentNode, provideUserGroupDownload, provideDashboardPermissionDownload, provideBuildHistoryDownload } from './sisense_dom.js';


async function turnOnSisensePocketOnDataPage(host, authCookie) {

    let [cubeInfoList, cubeBuildList, userGroupManager] = await Promise.all(
        [
            sendGetRequest(host, 'api/v1/elasticubes/getElasticubesWithMetadata', authCookie),
            sendGetRequest(host, 'api/v2/builds', authCookie),
            getUserGroupManager(host, authCookie)
        ]
    );

    let cubeInfoMap = Object.fromEntries(cubeInfoList.map(cubeInfo => [cubeInfo.title, cubeInfo]));
    let parentNode = createParentNode();
    provideBuildHistoryDownload(parentNode, cubeBuildList);
    provideUserGroupDownload(parentNode, userGroupManager);
    showCubeDetails(parentNode, cubeInfoMap, userGroupManager)
}

async function turnOffSisensePocketOnDataPage() {
    for (let element of [].slice.call(document.body.childNodes)) {
        if (element.className === 'sisense-pocket-plugin') {
            element.remove();
        }
    }
}

async function turnOffSisensePocketOnDashboardPage() {
    for (let element of [].slice.call(document.getElementsByClassName('sisense-pocket-plugin'))) {
        element.remove();
    }
}

async function turnOnSisensePocketOnDashboardPage(host, authCookie, dashboardId) {
    let [dashboardInfo, dashboardPermission, userGroupManager] = await Promise.all(
        [
            sendGetRequest(host, `api/v1/dashboards/${dashboardId}`, authCookie),
            sendGetRequest(host, `api/v1/dashboards/${dashboardId}/shares`, authCookie),
            getUserGroupManager(host, authCookie)
        ]
    );

    let dashboardName = dashboardInfo.title.trim();
    await provideDashboardPermissionDownload(dashboardName, dashboardPermission, userGroupManager);
}

async function startCubePocket(host, authCookie) {

    if (window.location.pathname === '/app/data' || window.location.pathname === '/app/data/') {
        await turnOffSisensePocketOnDataPage();
        await turnOnSisensePocketOnDataPage(host, authCookie);
        return
    }

    let arr = /\/dashboards\/(\w+)$/g.exec(window.location.href);
    if(arr) {
        let dashboardId = arr[1];
        await turnOffSisensePocketOnDashboardPage();
        await turnOnSisensePocketOnDashboardPage(host, authCookie, dashboardId);
    }

}

chrome.runtime.onMessage.addListener(function (message) {
    switch (message.command) {
        case "startCubePocket":
            startCubePocket(message.host, message.authCookie).then(res => {}).catch(res => console.log(res));
            break;
    }
});
