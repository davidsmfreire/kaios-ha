import assert from 'assert';
import { getEntityState, HomeAssistantService } from './ts/home_assistant';

const KEY_TO_SERVICE = {
    "1": new HomeAssistantService("script/turn_on", "garage_door"),
    "2": new HomeAssistantService("switch/toggle", "garage_led"),
    // ...
}

const ENTITIES_WITH_STATE = {
    "garage_led": "Garage Light",
    "garage_door_sensor": "Garage Door",
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

    for (var entity_name in ENTITIES_WITH_STATE) {
        const entity_pretty_name = ENTITIES_WITH_STATE[entity_name];
        const entity_state = await getEntityState(entity_name);
        if (entity_state === null) {
            continue;
        }
        const node = document.createElement("SPAN");
        const text = document.createTextNode(`${entity_pretty_name}: ${entity_state.state}`);
        node.appendChild(text);
        node.setAttribute("id", entity_name);
        entities.appendChild(node);
    }
})();

const updateEntityStates = async function () {
    for (var entity_name in ENTITIES_WITH_STATE) {
        const span = document.getElementById(entity_name);
        if(span === null) {
            continue;
        }
        const entity_state = await getEntityState(entity_name);
        if (entity_state === null) {
            continue;
        }
        span.textContent = `${ENTITIES_WITH_STATE[entity_name]}: ${entity_state.state}`
    }
}

setInterval(function() {
    updateEntityStates().catch(console.log);
}, 1000);
