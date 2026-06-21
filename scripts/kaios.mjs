import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

// node-firefox-* are CommonJS; load them from this ESM module.
const require = createRequire(import.meta.url);
const connect = require('node-firefox-connect');
const installApp = require('node-firefox-install-app');

const PORT = process.env.DEBUGGER_PORT || 6000;
// Stable app id so each flash REPLACES the app rather than installing a new
// random-uuid copy. Keeps the manifest URL constant: app://kaios-ha/manifest.webapp
const APP_ID = 'kaios-ha';

// Build (from ./build) is zipped + installed over the KaiOS debugging protocol,
// then the app is relaunched so the device runs the fresh code (KaiOS otherwise
// resumes the already-running instance and shows its pre-flash page).
// Returns the connected client, the webapps manager, and the manifest URL.
export async function installAndLaunch() {
  execFileSync('adb', ['forward', `tcp:${PORT}`, 'localfilesystem:/data/local/debugger-socket'], { stdio: 'inherit' });
  const client = await connect(PORT);
  const appId = await installApp({ appPath: 'build', client, id: APP_ID });
  const manifestURL = `app://${appId}/manifest.webapp`;
  const manager = await new Promise((resolve, reject) => client.getWebapps((e, m) => (e ? reject(e) : resolve(m))));
  await new Promise((resolve) => manager.close(manifestURL, () => resolve())); // no-op if not running
  await new Promise((resolve, reject) => manager.launch(manifestURL, (e) => (e ? reject(e) : resolve())));
  return { client, manager, manifestURL };
}
