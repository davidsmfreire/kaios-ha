import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

// node-firefox-* are CommonJS; load them from this ESM script.
const require = createRequire(import.meta.url);
const connect = require('node-firefox-connect');
const installApp = require('node-firefox-install-app');

const PORT = process.env.DEBUGGER_PORT || 6000;
// Stable app id so each flash REPLACES the app instead of installing a new
// random-uuid copy (which leaves stale installs behind). Keeps the manifest
// URL constant: app://kaios-ha/manifest.webapp
const APP_ID = 'kaios-ha';

execFileSync('adb', ['forward', `tcp:${PORT}`, 'localfilesystem:/data/local/debugger-socket'], { stdio: 'inherit' });
const client = await connect(PORT);
const appId = await installApp({ appPath: 'build', client, id: APP_ID });
console.log(`Installed app://${appId}/manifest.webapp`);
process.exit(0);
