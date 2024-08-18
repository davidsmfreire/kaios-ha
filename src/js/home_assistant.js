import { TOKEN, SERVER_ADDRESS, HA_ENTITIES } from './env';

export class HomeAssistantService {
    constructor(service, entity) {
        if (!(entity in HA_ENTITIES)) {
            console.log(`Unknown entity: ${entity}`);
            return;
        }
        this.service = service;
        this.entity = entity;
    }

    async run() {
        let entityID = HA_ENTITIES[this.entity];
    
        const url = `${SERVER_ADDRESS}/api/services/${this.service}`;
    
        const method = 'POST';
        const data = {
            entity_id: entityID
        };
        const headers = {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        };
        console.log(`Calling ${url} with ${JSON.stringify(data)}`);
    
        customFetch(method, url, data, headers)
        .then(_response => null) // do nothing with the response for now
        .catch(function (error) {
            console.error('Error:', error.message);
        });
    }

}

export async function getEntityState(entity) {
    if (!(entity in HA_ENTITIES)) {
        console.log(`Unknown entity: ${entity}`);
        return;
    }

    let entityID = HA_ENTITIES[entity];

    const url = `${SERVER_ADDRESS}/api/states/${entityID}`;

    const method = 'GET';
    const data = null;
    const headers = {
        'Authorization': `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
    };
    console.log(`Calling ${url} with ${JSON.stringify(data)}`);

    return await customFetch(method, url, data, headers).then(
        (response) => {
            return response;
        }
    )
    .catch(function (error) {
        console.error('Error:', error.message);
        return null;
    });
}

function customFetch(method, url, data, headers = {}) {
    return new Promise(function (resolve, reject) {
        // 'mozSystem: true' bypasses CORS in KaiOS (only works on old versions of Firefox)
        var xhr = new XMLHttpRequest({ mozSystem: true });

        xhr.open(method, url, true);

        Object.keys(headers).forEach(function (key) {
            xhr.setRequestHeader(key, headers[key]);
        });

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(JSON.parse(xhr.responseText));
                } else {
                    reject(new Error('Request failed with status: ' + xhr.status));
                }
            }
        };

        if (data) {
            var jsonData = JSON.stringify(data);
            xhr.send(jsonData);
        } else {
            xhr.send();
        }
    });
}
