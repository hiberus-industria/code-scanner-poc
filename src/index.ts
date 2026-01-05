import { barCodeEmitter, validateBarCode } from './devices/barCodeValidator.js';
import { HidDevice, hidEmitter } from './devices/hidDiscovery.js';
import { USBDiscovery } from './devices/USBDiscovery.js';
import { parseHidData, parserEmitter } from './devices/hidParser.js';
import { detectDeviceType, DeviceType } from './devices/deviceDetector.js';
import { parseWeight } from './devices/parseWeight.js';
import { logger } from './infra/logger.js';
import HID from 'node-hid';
import { EventSender } from './transport/sender.js';
import { Queue } from './transport/queue.js';

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

// LLamamos al objeto de descubrimiento HID
const hidDiscovery = new HidDevice();
hidDiscovery.connect(vendorId, productName);

const usbDiscovery = new USBDiscovery();
usbDiscovery.connect(vendorId, productName);

// Global listener for parsed lines
parserEmitter.on('raw:scan', (line: string) => {
  validateBarCode(line);
});

const queue = new Queue();
const sender = new EventSender(queue);
sender.start();

barCodeEmitter.on('code:validated', async ({ simbology, valid }) => {
  console.log(`Symbology: ${simbology} | Valid: ${valid ? 'Yes' : 'No'}`);
  await queue.enqueueEvent('http://localhost:8000/events', { simbology, valid });
});

// Initial connection
hidEmitter.on('device:connected', (found) => {
  cleanupDevice(currentDevice);
  try {
    const deviceType = detectDeviceType(found);
    logger.info({ deviceType, product: found.product, path: found.path }, 'Device connected');

    currentDevice = new HID.HID(found.path);

    if (deviceType === DeviceType.WEIGHING_DEVICE) {
      // Manejo de báscula
      logger.info('Setting up weighing device listener');
      currentDevice.on('data', async (data: Buffer) => {
        const result = parseWeight(data);

        if (result.isValid) {
          logger.info({ weight: result.weight, unit: result.unit }, 'Weight received');
          await queue.enqueueEvent('http://localhost:8000/weight', {
            simbology: `${result.weight}${result.unit}`,
            valid: 'true',
          });
        } else {
          logger.warn({ error: result.error, raw: result.raw }, 'Invalid weight data');
        }
      });
    } else if (deviceType === DeviceType.BARCODE_SCANNER) {
      // Manejo de lector de código de barras
      logger.info('Setting up barcode scanner listener');
      currentDevice.on('data', (data: Buffer) => parseHidData(data));
    }

    currentDevice.on('error', () => cleanupDevice(currentDevice));
  } catch (err) {
    logger.error({ error: err }, 'Error connecting device');
  }
});

// Reconnect
hidEmitter.on('device:reconnected', (found) => {
  cleanupDevice(currentDevice);
  try {
    const deviceType = detectDeviceType(found);
    logger.info({ deviceType, product: found.product, path: found.path }, 'Device reconnected');

    currentDevice = new HID.HID(found.path);

    if (deviceType === DeviceType.WEIGHING_DEVICE) {
      // Manejo de báscula
      logger.info('Setting up weighing device listener');
      currentDevice.on('data', async (data: Buffer) => {
        const result = parseWeight(data);

        if (result.isValid) {
          logger.info({ weight: result.weight, unit: result.unit }, 'Weight received');
          await queue.enqueueEvent('http://localhost:8000/weight', {
            simbology: `${result.weight}${result.unit}`,
            valid: 'true',
          });
        } else {
          logger.warn({ error: result.error, raw: result.raw }, 'Invalid weight data');
        }
      });
    } else if (deviceType === DeviceType.BARCODE_SCANNER) {
      // Manejo de lector de código de barras
      logger.info('Setting up barcode scanner listener');
      currentDevice.on('data', (data: Buffer) => parseHidData(data));
    }

    currentDevice.on('error', () => cleanupDevice(currentDevice));
  } catch (err) {
    logger.error({ error: err }, 'Error reconnecting device');
  }
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

process.on('SIGINT', () => {
  cleanupDevice(currentDevice);
  process.exit(0);
});
