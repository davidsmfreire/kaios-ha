import { createInterface } from 'node:readline';
import { stdin as input, stdout as output } from 'node:process';
import { installAndLaunch } from './kaios.mjs';

// Prompt for one or more servers, install, seed the config, and reload — so the
// device skips the in-app add-server form and lands on the entity picker.
// A line queue makes this work for both an interactive TTY and piped stdin
// (where all lines can arrive before a prompt subscribes).
const rl = createInterface({ input });
const queue = [];
let waiting = null;
rl.on('line', (line) => { if (waiting) { const resolve = waiting; waiting = null; resolve(line); } else queue.push(line); });
const ask = (q) => { output.write(q); return new Promise((resolve) => (queue.length ? resolve(queue.shift()) : (waiting = resolve))); };

const servers = [];
let more;
do {
  const n = servers.length + 1;
  const name = (await ask(`Server ${n} name [Home]: `)).trim() || 'Home';
  const baseUrl = (await ask('  HA base URL (e.g. http://homeassistant.local:8123): ')).trim();
  const token = (await ask('  Long-lived token: ')).trim();
  if (!baseUrl || !token) {
    rl.close();
    console.error('URL and token are required.');
    process.exit(1);
  }
  servers.push({ id: `srv_${n}`, name, baseUrl, token, pages: [{ id: `pg_${n}`, name: 'Home', tiles: [] }] });
  more = (await ask('Add another server? [y/N]: ')).trim().toLowerCase();
} while (more === 'y' || more === 'yes');
rl.close();

const config = {
  version: 1,
  activeServerId: servers[0].id,
  servers,
  settings: { pollIntervalMs: 5000, theme: 'dark' },
};

let manager, manifestURL;
try {
  ({ manager, manifestURL } = await installAndLaunch());
} catch {
  console.error('Could not reach the device over adb. Is the KaiOS phone connected with "ADB and DevTools" enabled? (With multiple devices attached, set ANDROID_SERIAL to the KaiOS serial.)');
  process.exit(1);
}

// Let the freshly launched app boot before talking to its console actor.
await new Promise((resolve) => setTimeout(resolve, 1500));

const app = await new Promise((resolve, reject) => manager.getApp(manifestURL, (e, a) => (e ? reject(e) : resolve(a))));
const js = `localStorage.setItem('kaios-ha.config', ${JSON.stringify(JSON.stringify(config))}); location.reload();`;
await new Promise((resolve, reject) => app.Console.evaluateJS(js, (e) => (e ? reject(e) : resolve())));

console.log(`Seeded ${servers.length} server(s) (active: ${servers[0].name}) → ${manifestURL} opens to the entity picker.`);
process.exit(0);
