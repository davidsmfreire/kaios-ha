import { TOKEN, SERVER_ADDRESS, CORS_PROXY } from './env';


export async function homeAssistantService(service, entityID) {
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
