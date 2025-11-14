import { barCodeEmitter, validateBarCode } from './devices/barCodeValidator.js';
import { hidEmitter, listHidDevices } from './devices/hidDiscovery.js';
import { parseHidData, parserEmitter } from './devices/hidParser.js';
import HID from 'node-hid';

const HEX_START = '0x';
const vendorIdRaw = process.env['VENDOR_ID'];
if (!vendorIdRaw) throw new Error('VENDOR_ID must be set');

let vendorId = Number(vendorIdRaw);
if (vendorIdRaw.trim().toLowerCase().startsWith(HEX_START)) {
  vendorId = parseInt(vendorIdRaw, 16);
}
if (Number.isNaN(vendorId)) {
  throw new Error(`VENDOR_ID is not a valid number: "${vendorIdRaw}"`);
}

const productName = process.env['PRODUCT'];
if (!productName) throw new Error('PRODUCT must be set');

let currentDevice: HID.HID | null = null;

// Global listener for parsed lines
parserEmitter.on('raw:scan', (line: string) => {
  validateBarCode(line);
});

barCodeEmitter.on('code:validated', ({ barcode, simbology, valid }) => {
  console.log(
    `Scanned Code: ${barcode} | Symbology: ${simbology} | Valid: ${valid ? 'Yes' : 'No'}`
  );
});

// Initial connection
hidEmitter.on('device:connected', (found) => {
  cleanupDevice(currentDevice);
  try {
    currentDevice = new HID.HID(found.path);
    currentDevice.on('data', (data: Buffer) => parseHidData(data));
    currentDevice.on('error', () => cleanupDevice(currentDevice));
  } catch {}
});

// Reconnect
hidEmitter.on('device:reconnect', (found) => {
  cleanupDevice(currentDevice);
  try {
    currentDevice = new HID.HID(found.path);
    currentDevice.on('data', (data: Buffer) => parseHidData(data));
    currentDevice.on('error', () => cleanupDevice(currentDevice));
  } catch {}
});

// Disconnect
hidEmitter.on('device:disconnected', () => {
  cleanupDevice(currentDevice);
});

// Device cleanup
function cleanupDevice(device: HID.HID | null) {
  if (!device) return;
  device.removeAllListeners();
  try {
    device.close();
  } catch {}
  if (device === currentDevice) currentDevice = null;
}

// init discovery
listHidDevices(vendorId, productName);

process.on('SIGINT', () => {
  cleanupDevice(currentDevice);
  process.exit(0);
});
