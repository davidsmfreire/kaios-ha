import 'kaios-gaia-l10n';
import './index.css';
import { runHomeAssistantService, HomeAssistantService } from './home_assistant';

const KEY_TO_SERVICE = {
    "1": new HomeAssistantService("script/turn_on", "garage_door"),
    "2": new HomeAssistantService("switch/toggle", "garage_led"),
    // ...
}

document.addEventListener("keydown", event => {
    console.log(event.KEY_TO_SERVICE)
    if (event.key in KEY_TO_SERVICE) {
        runHomeAssistantService(KEY_TO_SERVICE[event.key]);
    }
}
);
