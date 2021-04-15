'use strict';


async function toJson(response) {
    if(response.status > 300){
        return [];
    }
    return await response.json()
}


async function sendGetRequest(host, path, authCookie) {
    return await fetch(host + '/' + path, {
        method: 'GET',
        headers: {
            cookie: authCookie
        }
    }).then(toJson).then(
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
    a.className = "show-cube-details-plugin";
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


function provideBuildHistoryDownload(cubeBuildList) {

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

    let buttonArea = document.getElementsByClassName('prism-toolbar__cell btns-holder')[0];
    buttonArea.insertBefore(downloadLink, buttonArea.childNodes[0]);

}


function provideUserGroupDownload(userInfoList, groupInfoMap) {

    let userList = [['User Name', 'User Email', 'Last Login', 'Last Activity', 'Group Name'].join(',')];
    for (let userInfo of userInfoList){
        if(!userInfo.groups) {
            userList.push([`${userInfo.firstName} ${userInfo.lastName}`, `${userInfo.email}`, `${userInfo.lastLogin ? userInfo.lastLogin : ''}`, `${userInfo.lastActivity ? userInfo.lastActivity : ''}`, '-'].join(','))
            continue;
        }
        for (let groupId of userInfo.groups) {
            if (! groupInfoMap[groupId]) {
                userList.push([`${userInfo.firstName} ${userInfo.lastName}`, `${userInfo.email}`, `${userInfo.lastLogin ? userInfo.lastLogin : ''}`, `${userInfo.lastActivity ? userInfo.lastActivity : ''}`, `Unknown Group: ${groupId}`].join(','))
                // console.log(`Invalid Group Id: ${userInfo._id} ${groupId}`)
            } else {
                userList.push([`${userInfo.firstName} ${userInfo.lastName}`, `${userInfo.email}`, `${userInfo.lastLogin ? userInfo.lastLogin : ''}`, `${userInfo.lastActivity ? userInfo.lastActivity : ''}`, `${groupInfoMap[groupId].name}`].join(','))
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

    let buttonArea = document.getElementsByClassName('prism-toolbar__cell btns-holder')[0];
    buttonArea.insertBefore(downloadLink, buttonArea.childNodes[0]);
}


function appendSpanToElement(el, content, row) {
    let spanElement = document.createElement('span');
    let numOfEachRow = 3;
    spanElement.textContent = content;
    spanElement.className = "show-cube-details-plugin";
    spanElement.style = `position: absolute;top: ${parseInt(row / numOfEachRow) * 2}rem;left: ${33 + (row % numOfEachRow) * parseInt(65 / numOfEachRow)}rem`;
    el.appendChild(spanElement);
}


function appendBlobToElement(el, content, row) {
    let numOfEachRow = 3;

    const blob = new Blob(
        [content],
        { type: 'text/csv' }
    );

    const downloadLink = downloadBlob(blob, `Cube Permissions.csv`);

    downloadLink.title = 'Export Cube Permissions as CSV';

    downloadLink.textContent = 'Download Cube Permissions';


    downloadLink.style = `position: absolute;top: ${parseInt(row / numOfEachRow) * 2}rem;left: ${33 + (row % numOfEachRow) * parseInt(65 / numOfEachRow)}rem;z-index: 100`;

    el.appendChild(downloadLink);
}


function showCubeDetails(cubeElement, cubeInfoMap, userInfoMap, groupInfoMap, groupUserMap) {
    let cubeName = cubeElement.childNodes[0].childNodes[1].textContent;
    let cubeInfo = cubeInfoMap[cubeName];
    let userInfo = userInfoMap[cubeInfo.creator];
    let createdBy = `${userInfo.firstName} ${userInfo.lastName}`;
    let row = 0;
    appendSpanToElement(cubeElement.childNodes[0], `CreatedBy: ${createdBy}`, row++);

    let createdAt = cubeInfo.createdUtc ? new Date(parseInt(cubeInfo.createdUtc.replace('/Date(', '').replace(')/', ''))).toISOString() : '';
    appendSpanToElement(cubeElement.childNodes[0], `CreatedAt: ${createdAt}`, row++);
    appendSpanToElement(cubeElement.childNodes[0], `LastUpdatedAt: ${cubeInfo.lastUpdated ? cubeInfo.lastUpdated : ''}`, row++);

    appendSpanToElement(cubeElement.childNodes[0], `LastBuildTime: ${cubeInfo.lastBuildTime ? cubeInfo.lastBuildTime : ''}`, row++);
    appendSpanToElement(cubeElement.childNodes[0], `LastSuccessfulBuildTime: ${cubeInfo.lastSuccessfulBuildTime ? cubeInfo.lastSuccessfulBuildTime : ''}`, row++);
    appendSpanToElement(cubeElement.childNodes[0], '', row++);

    let permissionList = [['Cube Name', 'Group Name', 'User Name', 'User Email', 'Permission'].join(',')];

    let permissionMap = {'a': 'Can View Dashboards', 'r': 'Can Query', 'w': 'Can Edit'}

    if(cubeInfo.shares) {
        for (let entity of cubeInfo.shares){
            if (entity.type === 'user') {
                let userInfo = userInfoMap[entity.partyId];
                permissionList.push([cubeInfo.title, '-', `${userInfo.firstName} ${userInfo.lastName}`, userInfo.email, permissionMap[entity.permission]]);
            } else if (entity.type === 'group') {
                if(! groupUserMap[entity.partyId]) {
                    continue;
                }
                for (let userId of groupUserMap[entity.partyId]) {
                    let userInfo = userInfoMap[userId];
                    permissionList.push([cubeInfo.title, groupInfoMap[entity.partyId].name, `${userInfo.firstName} ${userInfo.lastName}`, userInfo.email, permissionMap[entity.permission]]);
                }
            }
        }
    }

    appendBlobToElement(cubeElement.childNodes[0], permissionList.join('\n'), row++);
}

async function startCubePocket(host, authCookie) {

    window.sisensePocket = window.sisensePocket || {};
    window.sisensePocket.isOn = window.sisensePocket.isOn === undefined ? false : !window.sisensePocket.isOn;

    if (!window.sisensePocket.isOn) {

        let cubeLists = document.getElementsByClassName('CubeList__cubeList___DhtDs');
        for (let cubes of cubeLists) {
            cubes.style.display = 'contents';
        }

        let [cubeInfoList, userInfoList, groupInfoList, cubeBuildList] = await Promise.all(
            [sendGetRequest(host, 'api/v1/elasticubes/getElasticubesWithMetadata', authCookie),
                    sendGetRequest(host, 'api/v1/users', authCookie),
                    sendGetRequest(host, 'api/v1/groups', authCookie),
                    sendGetRequest(host, 'api/v2/builds', authCookie),
                    sleep(500)]
        );

        let cubeInfoMap = {};
        for (let cubeInfo of cubeInfoList) {
            cubeInfoMap[cubeInfo.title] = cubeInfo;
        }

        let groupInfoMap = {};
        for (let groupInfo of groupInfoList) {
            groupInfoMap[groupInfo._id] = groupInfo;
        }

        let groupUserMap = {};
        let userInfoMap = {};
        for (let userInfo of userInfoList) {
            userInfoMap[userInfo._id] = userInfo;
            if(!userInfo.groups) {
                continue;
            }
            for (let groupId of userInfo.groups) {
                if(groupUserMap.hasOwnProperty(groupId)) {
                    groupUserMap[groupId].push(userInfo._id);
                } else {
                    groupUserMap[groupId] = [userInfo._id];
                }
            }
        }

        for (let cubes of cubeLists) {
            for (let cube of cubes.childNodes) {
                cube.style.width='auto';
                if(!cube.className.includes('CubeList__newCube___')){
                    showCubeDetails(cube, cubeInfoMap, userInfoMap, groupInfoMap, groupUserMap);
                }
            }
        }

        provideBuildHistoryDownload(cubeBuildList);
        provideUserGroupDownload(userInfoList, groupInfoMap);

    } else {

        for (let element of document.getElementsByClassName('show-cube-details-plugin')) {
            element.remove();
        }

        await sleep(500);

        for (let element of document.getElementsByClassName('show-cube-details-plugin')) {
            element.remove();
        }

        let cubeLists = document.getElementsByClassName('CubeList__cubeList___DhtDs');
        for (let cubes of cubeLists) {
            cubes.style.removeProperty('display');
            for (let cube of cubes.childNodes) {
                cube.style.removeProperty('width');
            }
        }
    }
}

chrome.runtime.onMessage.addListener(function (message) {
    switch (message.command) {
        case "startCubePocket":
            startCubePocket(message.host, message.authCookie).then(res => {}).catch(res => console.log(res));
            break;
    }
});

