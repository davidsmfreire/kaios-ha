import { startApp } from './app';
import { installDevEmulator } from './dev/emulator';

if (__DEV__) installDevEmulator();

const root = document.getElementById('screen');
if (root) startApp(root);
