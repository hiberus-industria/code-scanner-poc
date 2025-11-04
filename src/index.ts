import { listHidDevices } from './devices/hidDiscovery.js';

// eslint-disable-next-line prettier/prettier
await listHidDevices(0x0c2e);
