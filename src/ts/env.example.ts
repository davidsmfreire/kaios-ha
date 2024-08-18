export let SERVER_ADDRESS = "http://localhost:8123";

if (process.env.NODE_ENV === 'development') {
    // Bypass CORS during development, using proxy
    SERVER_ADDRESS = "http://localhost:5000/http://localhost:8123"
}

export const TOKEN="myLongTermToken";

export const HA_ENTITIES = {
    "garage_door": "script.garage_door_open",
    "garage_led": "switch.garage_light",
    "garage_door_sensor": "binary_sensor.garage_door",
}
