import { TOKEN, SERVER_ADDRESS, HA_ENTITIES } from './env';

export class HomeAssistantService {
    constructor(service, entity) {
        this.service = service;
        this.entity = entity;
    }
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

export async function runHomeAssistantService(service_obj) {
    let service = service_obj.service;
    let entity = service_obj.entity;

    if (!(entity in HA_ENTITIES)) {
        console.log(`entity unknown: ${entity}`);
        return;
    }

    let entityID = HA_ENTITIES[entity];

    try {
        // const url = `${CORS_PROXY}/${SERVER_ADDRESS}/api/services/${service}`;
        const url = `${SERVER_ADDRESS}/api/services/${service}`;
        
        console.log(url);

        const method = 'POST';
        const data = {
            entity_id: entityID
        };
        const headers = {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
        };

        const response = await customFetch(method, url, data, headers);

        if (response.ok) {
            console.log('Service ran successfuly.');
        } else {
            console.error('Failed to run service:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
};
