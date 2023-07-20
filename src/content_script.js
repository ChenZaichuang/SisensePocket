'use strict';

const tmpDashboardJson = JSON.stringify([
    {
        'title': '___',
        'oid': '64b7aa68145c49003343591c',
        'type': 'dashboard',
        'datasource': {
            'fullname': 'localhost/_',
            'id': 'localhost_a_',
            'address': 'LocalHost',
            'database': 'a_',
            'live': false,
            'title': '_'
        },
        'widgets': [
            {
                'title': 'RICHTEXT_MAIN.TITLE',
                'type': 'richtexteditor',
                'subtype': 'richtexteditor',
                'oid': '64b7aa95145c490033435921',
                'datasource': {
                    'fullname': 'localhost/_',
                    'id': 'localhost_a_',
                    'address': 'LocalHost',
                    'database': 'a_',
                    'live': false,
                    'title': '_'
                },
                'selection': null,
                'metadata': {
                    'ignore': {
                        'dimensions': [],
                        'ids': [],
                        'all': false
                    },
                    'panels': [],
                    'usedFormulasMapping': {}
                },
                'style': {
                    'content': {
                        'html': '',
                        'vAlign': 'valign-middle',
                        'bgColor': '#FFFFFF',
                        'textAlign': 'center'
                    }
                },
                'instanceid': 'A5954-B403-61',
                'options': {
                    'triggersDomready': true,
                    'hideFromWidgetList': true,
                    'disableExportToCSV': true,
                    'disableExportToImage': true,
                    'toolbarButton': {
                        'css': 'add-rich-text',
                        'tooltip': 'RICHTEXT_MAIN.TOOLBAR_BUTTON'
                    },
                    'selector': false,
                    'disallowSelector': true,
                    'disallowWidgetTitle': true,
                    'supportsHierarchies': false,
                    'dashboardFiltersMode': 'filter'
                },
                'dashboardid': '64b7aa68145c49003343591c',
                'lastOpened': null
            }
        ]
    }
])

async function toJson(response) {
    if(response.status > 300){
        return [];
    }
    return await response.json()
}

async function toText(response) {
    return await response.text()
}


async function sendGetRequest(host, path, authCookie) {
    return await fetch(host + '/' + path, {
        method: 'GET',
        headers: {
            'content-type': 'application/json;charset=UTF-8',
            'cookie': authCookie
        }
    }).then(toJson).then(
        data => {
            return data;
        }
    )
}

async function sendDeleteRequest(host, path, authCookie) {
    return await fetch(host + '/' + path, {
        method: 'DELETE',
        headers: {
            'cookie': authCookie
        }
    }).then(toText).then(
        data => {
            return data;
        }
    )
}

async function sendPostRequest(host, path, body, authCookie, isJsonResponse=true) {
    let responseParser;
    if (isJsonResponse) {
        responseParser = toJson;
    } else {
        responseParser = toText;
    }
    return await fetch(host + '/' + path, {
        method: 'POST',
        headers: {
            'content-type': 'application/json;charset=UTF-8',
            'cookie': authCookie
        },
        body: body
    }).then(responseParser).then(
        data => {
            return data;
        }
    )
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.className = "sisense-pocket-plugin";
    a.href = url;
    a.download = filename || 'download';

    const clickHandler = (event) => {

        let _a = document.createElement("a");
        document.body.appendChild(_a);
        _a.style = "display: none";
        _a.href = url;
        _a.download = filename || 'download';
        _a.click();
        _a.remove();

        event.preventDefault();
        event.stopPropagation();
    };

    a.addEventListener('click', clickHandler, false);

    return a;
}


function provideBuildHistoryDownload(parentNode, cubeBuildList) {

    let buildList = [['Cube Name', 'Start Time', 'End Time', 'Result'].join(',')];

    cubeBuildList.sort(function(a, b){
        if (a.datamodelTitle < b.datamodelTitle) {
            return -1;
        }else if (a.datamodelTitle > b.datamodelTitle) {
            return 1;
        }

        if (a.started < b.started) {
            return 1;
        }else if (a.started > b.started) {
            return -1;
        }

        return 0;
    });

    for (let build of cubeBuildList){
        buildList.push([`${build.datamodelTitle}`, `${build.started}`, `${build.completed}`, `${build.status}`].join(','))
    }

    const blob = new Blob(
        [buildList.join('\n')],
        { type: 'text/csv' }
    );

    const downloadLink = downloadBlob(blob, `Cube Build History.csv`);

    downloadLink.title = 'Export Cube Build History as CSV';

    downloadLink.textContent = 'Download Cube Build History';

    parentNode.appendChild(downloadLink);

}


function provideDashboardPermissionDownload(dashboardName, dashboardPermission, userNameInfoMap) {
    let permissionList = [];
    for (let permission of dashboardPermission){
        if (permission.type === 'user') {
            let userInfo = userNameInfoMap[permission.user.userName.trim()];
            permissionList.push([dashboardName, '-', `${userInfo.firstName ? userInfo.firstName.trim() : ''}${userInfo.lastName ? ' ' + userInfo.lastName.trim() : ''}`, userInfo.userName.trim(), userInfo.email.trim(), permission.rule ? permission.rule.trim() : 'owner']);
        } else if (permission.type === 'group') {
            let groupName = permission.group.name.trim();
            for (let user of permission.group.users) {
                let userInfo = userNameInfoMap[user.userName.trim()];
                permissionList.push([dashboardName, groupName, `${userInfo.firstName ? userInfo.firstName.trim() : ''}${userInfo.lastName ? ' ' + userInfo.lastName.trim() : ''}`, userInfo.userName.trim(), userInfo.email.trim(), permission.rule ? permission.rule.trim() : 'owner']);
            }
        }
    }

    let permissionOrder = {
        'view': 1,
        'edit': 2,
        'owner': 3
    }

    permissionList.sort(function(a, b){
        if (a[1] < b[1]) {
            return -1;
        }else if (a[1] > b[1]) {
            return 1;
        }

        if (permissionOrder[a[4]] < permissionOrder[b[4]]) {
            return 1;
        }else if (permissionOrder[a[4]] > permissionOrder[b[4]]) {
            return -1;
        }

        return 0;
    });

    permissionList.unshift(['Dashboard Name', 'Group Name', 'User Full Name', 'Sisense UserName', 'User Email', 'Permission']);

    const blob = new Blob(
        [permissionList.join('\n')],
        { type: 'text/csv' }
    );

    const downloadLink = downloadBlob(blob, `${dashboardName} Permission.csv`);

    downloadLink.title = 'Export Dashboard Permission as CSV';

    downloadLink.textContent = 'Download Dashboard Permission';

    downloadLink.style.marginRight = '12px';
    downloadLink.style.padding = '15px 0';

    let dashboardTileElement = document.getElementsByClassName('prism-toolbar__section prism-toolbar__section--left')[0];
    dashboardTileElement.insertBefore(downloadLink, dashboardTileElement.childNodes[0]);
}


function provideUserGroupDownload(parentNode, userInfoList, groupInfoMap, userGroupMap) {

    let userList = [['User Full Name', "Sisense UserName", 'User Email', 'Group Name'].join(',')];
    for (let userInfo of userInfoList){
        if(!userGroupMap.has(userInfo._id)) {
            userList.push([`${userInfo.firstName ? userInfo.firstName.trim() : ''}${userInfo.lastName ? ' ' + userInfo.lastName.trim() : ''}`, `${userInfo.userName.trim()}`, `${userInfo.email.trim()}`, '-'].join(','))
            continue;
        }
        for (let groupId of userGroupMap.get(userInfo._id)) {
            if (! groupInfoMap.has(groupId)) {
                userList.push([`${userInfo.firstName ? userInfo.firstName.trim() : ''}${userInfo.lastName ? ' ' + userInfo.lastName.trim() : ''}`, `${userInfo.userName.trim()}`, `${userInfo.email.trim()}`, `Unknown Group: ${groupId}`].join(','))
            } else {
                userList.push([`${userInfo.firstName ? userInfo.firstName.trim() : ''}${userInfo.lastName ? ' ' + userInfo.lastName.trim() : ''}`, `${userInfo.userName.trim()}`, `${userInfo.email.trim()}`, `${groupInfoMap.get(groupId).name.trim()}`].join(','))
            }
        }
    }

    const blob = new Blob(
        [userList.join('\n')],
        { type: 'text/csv' }
    );

    const downloadLink = downloadBlob(blob, `User Group Info.csv`);

    downloadLink.title = 'Export User Group Info as CSV';

    downloadLink.textContent = 'Download User Group Info';

    downloadLink.style.marginLeft = '200px';

    parentNode.appendChild(downloadLink);

}


function showCubeDetails(parentNode, cubeInfoMap, userInfoMap, groupInfoMap, groupUserMap) {

    let data = [
        ["Cube Name", "CreatedBy", "CreatedAt", "LastUpdatedAt", "LastBuildTime", "LastSuccessfulBuildTime", "Cube Permission"].map(value => document.createTextNode(value))
    ]

    for (const [cubeName, cubeInfo] of Object.entries(cubeInfoMap)) {
        let userInfo = userInfoMap.get(cubeInfo.creator);

        let permissionList = [['Cube Name', 'Group Name', 'User Name', 'User Email', 'Permission'].join(',')];

        let permissionMap = {'a': 'Can View Dashboards', 'r': 'Can Query', 'w': 'Can Edit'}

        if(cubeInfo.shares) {
            for (let entity of cubeInfo.shares){
                if (entity.type === 'user') {
                    let userInfo = userInfoMap.get(entity.partyId);
                    permissionList.push([cubeInfo.title.trim(), '-', `${userInfo.firstName ? userInfo.firstName.trim() : ''}${userInfo.lastName ? ' ' + userInfo.lastName.trim() : ''}`, userInfo.email.trim(), permissionMap[entity.permission.trim()]]);
                } else if (entity.type === 'group') {
                    if(! groupUserMap.get(entity.partyId)) {
                        continue;
                    }
                    for (let userId of groupUserMap.get(entity.partyId)) {
                        let userInfo = userInfoMap.get(userId);
                        permissionList.push([cubeInfo.title.trim(), groupInfoMap.get(entity.partyId).name.trim(), `${userInfo.firstName ? userInfo.firstName.trim() : ''}${userInfo.lastName ? ' ' + userInfo.lastName.trim() : ''}`, userInfo.email.trim(), permissionMap[entity.permission.trim()]]);
                    }
                }
            }
        }

        let blob = new Blob(
            [permissionList.join('\n')],
            { type: 'text/csv' }
        );

        let downloadLink = downloadBlob(blob, `${cubeInfo.title} Permission.csv`);

        downloadLink.title = 'Export Cube Permissions as CSV';

        downloadLink.textContent = 'Download';

        data.push([
            document.createTextNode(cubeName),
            document.createTextNode(`${userInfo.firstName} ${userInfo.lastName}`),
            document.createTextNode(cubeInfo.createdUtc ? new Date(parseInt(cubeInfo.createdUtc.replace('/Date(', '').replace(')/', ''))).toISOString() : ''),
            document.createTextNode(cubeInfo.lastUpdated ? cubeInfo.lastUpdated : ''),
            document.createTextNode(cubeInfo.lastBuildTime ? cubeInfo.lastBuildTime : ''),
            document.createTextNode(cubeInfo.lastSuccessfulBuildTime ? cubeInfo.lastSuccessfulBuildTime : ''),
            downloadLink,
        ]);
    }

    let table = document.createElement('table');
    table.style.width  = '100px';
    table.style.border = '1px solid black';

    for(let i = 0; i < data.length; i++){
        let tr = table.insertRow();
        tr.style.whiteSpace = "nowrap";
        for(let j = 0; j < data[i].length; j++){
            let td = tr.insertCell();
            td.appendChild(data[i][j]);
            td.style.border = '1px solid black';
            td.style.padding = "8px";
            td.style.margin = "8px";
        }
    }
    parentNode.appendChild(table);

}

function createParentNode() {
    let maskDiv = document.createElement('div');
    maskDiv.className = "sisense-pocket-plugin";
    maskDiv.style = 'z-index: 100;\n' +
        'position: fixed;\n' +
        'background: grey;\n' +
        'top: 0;\n' +
        'left: 0;\n' +
        'height: 100%;\n' +
        'width: 100%;\n' +
        'opacity: 60%;';
    document.body.appendChild(maskDiv);

    let parentNode = document.createElement('div');
    parentNode.className = "sisense-pocket-plugin";
    parentNode.style = 'left: 50%;\n' +
        'top: 50%;\n' +
        '-webkit-transform: translate(-50%, -50%);\n' +
        'transform: translate(-50%, -50%);\n' +
        'z-index: 100;\n' +
        'position: fixed;\n' +
        'max-height : 80%;\n;\n' +
        'overflow-y: scroll;\n' +
        'background: white;'

    document.body.appendChild(parentNode);
    let btn = document.createElement("button");
    btn.innerHTML = "x";
    btn.style.float = 'right';
    btn.onclick = turnOffSisensePocketOnDataPage;
    parentNode.appendChild(btn);
    return parentNode;
}

async function getGroupUserInfo(host, authCookie) {
    let [groupInfoList, newDashboards] = await Promise.all(
        [
            sendGetRequest(host, 'api/v1/groups', authCookie),
            sendPostRequest(host, 'api/v1/dashboards/import/bulk?action=overwrite', tmpDashboardJson, authCookie, true)
        ]
    );
    const userInfoListPromise = await sendGetRequest(host, 'api/v1/users', authCookie);
    const newDashboard = newDashboards['succeded'][0];
    const dashboardId = newDashboard['oid'];
    const initShares = newDashboard['shares'];
    initShares[0]['subscribe'] = false;

    const groupInfoMap = new Map();
    for (const group of groupInfoList) {
        initShares.push({
            shareId: group['_id'],
            type : "group",
            subscribe: false
        });
        groupInfoMap.set(group['_id'], group);
    }

    const dashboardSharingPayload = JSON.stringify({
        'sharesTo': initShares
    })
    await sendPostRequest(host, `api/shares/dashboard/${dashboardId}`, dashboardSharingPayload, authCookie, false);
    const currentDashboardPermission = await sendGetRequest(host, `api/v1/dashboards/${dashboardId}/shares?expand=user(fields:userName),group.users(fields:userName)`, authCookie);
    sendDeleteRequest(host, `api/dashboards/${dashboardId}`, authCookie);
    const userGroupMap = new Map();
    const groupUserMap = new Map();
    for (const share of currentDashboardPermission) {
        if (share["type"] !== 'group') {
            continue
        }
        const groupId = share['group']['_id']
        for (const user of share['group']['users']) {
            const userId = user['_id'];

            if (!userGroupMap.has(userId)) {
                userGroupMap.set(userId, []);
            }
            userGroupMap.get(userId).push(groupId);

            if (!groupUserMap.has(groupId)) {
                groupUserMap.set(groupId, []);
            }
            groupUserMap.get(groupId).push(userId);
        }
    }
    const userInfoList = await userInfoListPromise;
    const userInfoMap = new Map();
    for (const user of userInfoList) {
        userInfoMap.set(user['_id'], user);
    }

    return {
        userInfoList: userInfoList,
        userInfoMap: userInfoMap,
        groupInfoMap: groupInfoMap,
        userGroupMap: userGroupMap,
        groupUserMap: groupUserMap
    }
}

async function turnOnSisensePocketOnDataPage(host, authCookie) {

    let [cubeInfoList, cubeBuildList, groupUserInfo] = await Promise.all(
        [
            sendGetRequest(host, 'api/v1/elasticubes/getElasticubesWithMetadata', authCookie),
            sendGetRequest(host, 'api/v2/builds', authCookie),
            getGroupUserInfo(host, authCookie)
        ]
    );

    let cubeInfoMap = Object.fromEntries(cubeInfoList.map(cubeInfo => [cubeInfo.title, cubeInfo]));

    const userInfoList = groupUserInfo.userInfoList;
    let groupInfoMap = groupUserInfo.groupInfoMap;
    let userInfoMap = groupUserInfo.userInfoMap;
    let userGroupMap = groupUserInfo.userGroupMap;
    let groupUserMap = groupUserInfo.groupUserMap;

    let parentNode = createParentNode();
    provideBuildHistoryDownload(parentNode, cubeBuildList);
    provideUserGroupDownload(parentNode, userInfoList, groupInfoMap, userGroupMap);
    showCubeDetails(parentNode, cubeInfoMap, userInfoMap, groupInfoMap, groupUserMap)
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
    let [dashboardInfo, dashboardPermission, userInfoList] = await Promise.all(
        [sendGetRequest(host, `api/v1/dashboards/${dashboardId}`, authCookie),
            sendGetRequest(host, `api/v1/dashboards/${dashboardId}/shares?expand=user(fields:userName),group.users(fields:userName)`, authCookie),
            sendGetRequest(host, 'api/v1/users', authCookie)]
    );
    let userNameInfoMap = {};
    for (let userInfo of userInfoList) {
        userNameInfoMap[userInfo.userName.trim()] = userInfo;
    }
    let dashboardName = dashboardInfo.title.trim();
    await provideDashboardPermissionDownload(dashboardName, dashboardPermission, userNameInfoMap);
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
