'use strict';

async function getAuthCookie(url) {
    return new Promise((resolve, reject) => {
        chrome.cookies.getAll({"url": url, "name": ".prism"}, function (cookies) {
            resolve(".prism=" + encodeURIComponent(cookies[0].value));
        });
    })
}

async function startCubePocket(tab) {
    const url = new URL(tab.url);
    const host = url.protocol + '//' + url.host;
    const authCookie = await getAuthCookie(host);

    await chrome.tabs.sendMessage(tab.id, {
        command: "startCubePocket",
        host: host,
        authCookie: authCookie
    });
}

chrome.action.onClicked.addListener(function (tab) {
    startCubePocket(tab).then(res => console.log(res)).catch(res => console.log(res));
});
