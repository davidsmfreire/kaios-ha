import { TOKEN, SERVER_ADDRESS, CORS_PROXY, HA_ENTITIES } from './env';

export function HomeAssistantService(service, entity) {
    this.service = service;
    this.entity = entity;
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
        const url = `${CORS_PROXY}/${SERVER_ADDRESS}/api/services/${service}`;
        console.log(url);
        const requestOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                entity_id: entityID
            })
        };

        const response = await fetch(url, requestOptions);

        if (response.ok) {
            console.log('Service ran successfuly.');
        } else {
            console.error('Failed to run service:', response.statusText);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
};
