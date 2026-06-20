import { installAndLaunch } from './kaios.mjs';

const { manifestURL } = await installAndLaunch();
console.log(`Installed + launched ${manifestURL}`);
process.exit(0);
