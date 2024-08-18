import { TOKEN, SERVER_ADDRESS, HA_ENTITIES } from './env';

interface EntityState {
    state: string
    entity_id: string
}

export class HomeAssistantService {
    name: string;
    entity_id: string;
    service: string;
    key: string;
    state_entity_id?: string;

    constructor(name: string, entity_alias: string, service: string, key: string, state_entity_alias?: string) {
        this.name = name;
        this.entity_id = HA_ENTITIES[entity_alias];
        this.service = service;
        this.key = key;
        if (state_entity_alias) {
            this.state_entity_id = HA_ENTITIES[state_entity_alias];
        }
    }

    async run() {
        const url = `${SERVER_ADDRESS}/api/services/${this.service}`;

        const method = 'POST';
        const data = {
            entity_id: this.entity_id
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

    async getState(): Promise<EntityState | null> {
        if(this.state_entity_id === undefined) {
            return null;
        }

        const url = `${SERVER_ADDRESS}/api/states/${this.state_entity_id}`;
    
        const method = 'GET';
        const data = null;
        const headers = {
            'Authorization': `Bearer ${TOKEN}`,
            "Content-Type": "application/json"
        };
        console.log(`Calling ${url} with ${JSON.stringify(data)}`);
    
        return await customFetch(method, url, data, headers).then(
            (response) => {
                return response as EntityState;
            }
        )
        .catch(function (error) {
            console.error('Error:', error.message);
            return null;
        });
    }
}

function customFetch(method, url, data, headers = {}) {
    return new Promise(function (resolve, reject) {
        // 'mozSystem: true' bypasses CORS in KaiOS (only works on old versions of Firefox)
        // @ts-ignore
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
