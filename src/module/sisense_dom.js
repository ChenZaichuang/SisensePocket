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

    downloadLink.title = 'Cube Build History as CSV';

    downloadLink.textContent = 'Download Cube Build History';

    parentNode.appendChild(downloadLink);

}


function provideDashboardPermissionDownload(dashboardName, dashboardPermission, userGroupManager) {
    let permissionList = [];
    for (let permission of dashboardPermission){
        if (permission.type === 'user') {
            let userInfo = userGroupManager.getUserById(permission.shareId);
            permissionList.push([dashboardName, '-', '-', userInfo._id, `${userInfo.firstName ? userInfo.firstName : ''}${userInfo.lastName ? ' ' + userInfo.lastName : ''}`, userInfo.userName, userInfo.email, permission.rule ? permission.rule : 'owner']);
        } else if (permission.type === 'group') {
            const groupId = permission.shareId;
            const group = userGroupManager.getGroupById(groupId)
            for (let userInfo of userGroupManager.getUsersOfGroup(groupId)) {
                permissionList.push([dashboardName, groupId, group.name, userInfo._id, `${userInfo.firstName ? userInfo.firstName : ''}${userInfo.lastName ? ' ' + userInfo.lastName : ''}`, userInfo.userName, userInfo.email, permission.rule ? permission.rule : 'owner']);
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

    permissionList.unshift(['Dashboard Name', 'Group Id', 'Group Name', 'User Id', 'User Full Name', 'Sisense UserName', 'User Email', 'Permission']);

    const blob = new Blob(
        [permissionList.join('\n')],
        { type: 'text/csv' }
    );

    const downloadLink = downloadBlob(blob, `${dashboardName} Permission.csv`);

    downloadLink.title = 'Dashboard Permission as CSV';

    downloadLink.textContent = 'Download Dashboard Permission';

    downloadLink.style.marginRight = '12px';
    downloadLink.style.padding = '15px 0';

    let dashboardTileElement = document.getElementsByClassName('prism-toolbar__section prism-toolbar__section--left')[0];
    dashboardTileElement.insertBefore(downloadLink, dashboardTileElement.childNodes[0]);
}


function provideUserGroupDownload(parentNode, userGroupManager) {

    let userList = [['User Id', 'User Full Name', "Sisense UserName", 'User Email', 'Group Id', 'Group Name'].join(',')];
    for (let userInfo of userGroupManager.getAllUsers()){
        const groups = userGroupManager.getGroupsOfUser(userInfo._id);
        for (let group of groups) {
            userList.push([`${userInfo._id}`, `${userInfo.firstName ? userInfo.firstName : ''}${userInfo.lastName ? ' ' + userInfo.lastName : ''}`, `${userInfo.userName}`, `${userInfo.email}`, `${group._id}`, `${group.name}`].join(','))
        }
    }

    const blob = new Blob(
        [userList.join('\n')],
        { type: 'text/csv' }
    );

    const downloadLink = downloadBlob(blob, `User Group Info.csv`);

    downloadLink.title = 'User Group Info as CSV';

    downloadLink.textContent = 'Download User Group Info';

    downloadLink.style.marginLeft = '200px';

    parentNode.appendChild(downloadLink);

}


function showCubeDetails(parentNode, cubeInfoMap, userGroupManager) {

    let data = [
        ["Cube Name", "CreatedBy", "CreatedAt", "LastUpdatedAt", "LastBuildTime", "LastSuccessfulBuildTime", "Cube Permission"].map(value => document.createTextNode(value))
    ]

    for (const [cubeName, cubeInfo] of Object.entries(cubeInfoMap)) {
        let cubeCreator = userGroupManager.getUserById(cubeInfo.creator);

        let permissionList = [['Cube Name', 'Group Name', 'User Name', 'User Email', 'Permission'].join(',')];

        let permissionMap = {'a': 'Can View Dashboards', 'r': 'Can Query', 'w': 'Can Edit'}

        if(cubeInfo.shares) {
            for (let entity of cubeInfo.shares){
                if (entity.type === 'user') {
                    let userInfo = userGroupManager.getUserById(entity.partyId);
                    permissionList.push([cubeInfo.title, '-', `${userInfo.firstName ? userInfo.firstName : ''}${userInfo.lastName ? ' ' + userInfo.lastName : ''}`, userInfo.email, permissionMap[entity.permission]]);
                } else if (entity.type === 'group') {
                    const groupId = entity.partyId;
                    const group = userGroupManager.getGroupById(groupId);
                    for (let userInfo of userGroupManager.getUsersOfGroup(groupId)) {
                        permissionList.push([cubeInfo.title, group.name, `${userInfo.firstName ? userInfo.firstName : ''}${userInfo.lastName ? ' ' + userInfo.lastName : ''}`, userInfo.email, permissionMap[entity.permission]]);
                    }
                }
            }
        }

        let blob = new Blob(
            [permissionList.join('\n')],
            { type: 'text/csv' }
        );

        let downloadLink = downloadBlob(blob, `${cubeInfo.title} Permission.csv`);

        downloadLink.title = 'Cube Permissions as CSV';

        downloadLink.textContent = 'Download';

        data.push([
            document.createTextNode(cubeName),
            document.createTextNode(`${cubeCreator.firstName} ${cubeCreator.lastName}`),
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