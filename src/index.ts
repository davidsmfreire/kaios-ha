import { loadConfig } from './store/config';

const config = loadConfig();
console.log(`KaiOS HA foundation loaded — ${config.servers.length} server(s) configured`);
