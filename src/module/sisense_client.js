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
