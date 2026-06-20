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
const manifestURL = `app://${appId}/manifest.webapp`;

// Relaunch so the device runs the freshly installed code. KaiOS otherwise
// resumes the already-running instance and shows its pre-flash page.
const manager = await new Promise((resolve, reject) => client.getWebapps((e, m) => (e ? reject(e) : resolve(m))));
await new Promise((resolve) => manager.close(manifestURL, () => resolve())); // no-op if not running
await new Promise((resolve, reject) => manager.launch(manifestURL, (e) => (e ? reject(e) : resolve())));

console.log(`Installed + launched ${manifestURL}`);
process.exit(0);
