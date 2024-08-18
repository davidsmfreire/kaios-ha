import assert from 'assert';
import { HomeAssistantService } from './ts/home_assistant';

const ENTITIES = [
    new HomeAssistantService("Garage Door", "garage_door", "script/turn_on", "1", "garage_door_sensor"),
    new HomeAssistantService("Garage Light", "garage_led", "switch/toggle", "2", "garage_led"),
]


var KEY_TO_SERVICE = [];

(() => {
    for (const entity of ENTITIES) {
        KEY_TO_SERVICE[entity.key] = entity;
    }
})()

function spanText(entity: HomeAssistantService, state: string) {
    return `(${entity.key}) ${entity.name}: ${state}`
}

document.addEventListener("keydown", async event => {
    if (event.key in KEY_TO_SERVICE) {
        const service = KEY_TO_SERVICE[event.key]
        await service.run();
    }
}
);

(async () => {
    const entities = document.getElementById("entities");

    assert(entities !== null);

    for (const entity of ENTITIES) {
        const entity_state = await entity.getState();
        if (entity_state === null) {
            continue;
        }
        const node = document.createElement("SPAN");
        const text = document.createTextNode(spanText(entity, entity_state.state));
        node.appendChild(text);
        node.setAttribute("id", entity_state.entity_id);
        entities.appendChild(node);
    }
})();

const updateEntityStates = async function () {
    for (const entity of ENTITIES) {
        const entity_state = await entity.getState();
        if (entity_state === null) {
            continue;
        }
        const span = document.getElementById(entity_state.entity_id);
        if (span === null) {
            continue;
        }
        span.textContent = spanText(entity, entity_state.state);
    }
}

setInterval(function () {
    updateEntityStates().catch(console.log);
}, 1000);
