import 'kaios-gaia-l10n';
import './index.css';
import { HA_ENTITIES } from './env';
import { homeAssistantService } from './home_assistant';

const KEY_TO_SERVICE_AND_ENTITY = {
    "1": { service: "script/turn_on", entity: "garage_door" },
    "2": { service: "switch/toggle", entity: "garage_led" },
    // ...
}

document.addEventListener("keydown", event => {
    console.log(event.KEY_TO_SERVICE)
    if (event.key in hashmap) {
        service = KEY_TO_SERVICE_AND_ENTITY[event.key].service;
        entity = KEY_TO_SERVICE_AND_ENTITY[event.key].entity;
        if (!(entity in HA_ENTITIES)) {
            console.log(`entity unknown: ${entity}`);
            return;
        }
        homeAssistantService(service, HA_ENTITIES[entity])
    }
}
);
