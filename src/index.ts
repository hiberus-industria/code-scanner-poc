import { EventEmitter } from 'events';
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

// === Configuration ===
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

// === Domain Event Bus (centralized event dispatch) ===
export const deviceEventBus = new EventEmitter();

// === State ===
let currentDevice: HID.HID | null = null;

// === HID Discovery ===
const hidDiscovery = new HidDevice();
hidDiscovery.connect(vendorId, productName);

// === USB Discovery ===
const usbDiscovery = new USBDiscovery();
usbDiscovery.connect(vendorId, productName);

// === Barcode Parsing Chain ===
parserEmitter.on('raw:scan', (line: string) => {
  validateBarCode(line);
});

// === Queue & Transport ===
const queue = new Queue();
const sender = new EventSender(queue);
sender.start();

// === Domain Event Router: Maps domain events to transport ===
/**
 * Central point: all device events flow here before being enqueued.
 * Devices don't know about endpoints or queue—they emit domain events.
 */
deviceEventBus.on('barcode:scanned', async ({ simbology, valid }) => {
  logger.info({ simbology, valid }, 'Barcode scanned - enqueuing');
  await queue.enqueueEvent('http://localhost:8000/events', { simbology, valid });
});

deviceEventBus.on('weight:measured', async ({ weight, unit }) => {
  logger.info({ weight, unit }, 'Weight measured - enqueuing');
  await queue.enqueueEvent('http://localhost:8000/weight', {
    simbology: `${weight}${unit}`,
    valid: 'true',
  });
});

// === Barcode Validation → Domain Event ===
barCodeEmitter.on('code:validated', ({ simbology, valid }) => {
  console.log(`Symbology: ${simbology} | Valid: ${valid ? 'Yes' : 'No'}`);
  deviceEventBus.emit('barcode:scanned', { simbology, valid });
});

// === Device Setup (eliminates duplication between connect/reconnect) ===
/**
 * Single setup function: connects HID and attaches appropriate listener.
 * This runs once per device connection, regardless of whether it's first-time or reconnect.
 */
function setupDevice(found: {
  path: string;
  product?: string;
  vendorId: number;
  productId: number;
}): void {
  cleanupDevice(currentDevice);

  try {
    const deviceType = detectDeviceType(found);
    logger.info({ deviceType, product: found.product, path: found.path }, 'Device setup initiated');

    currentDevice = new HID.HID(found.path);

    // Attach handler based on device type (no queue logic here)
    if (deviceType === DeviceType.WEIGHING_DEVICE) {
      logger.info('Attaching weight device handler');
      currentDevice.on('data', async (data: Buffer) => {
        const result = parseWeight(data);
        if (result.isValid) {
          // Emit domain event—let the router decide where it goes
          deviceEventBus.emit('weight:measured', { weight: result.weight, unit: result.unit });
        } else {
          logger.warn({ error: result.error, raw: result.raw }, 'Invalid weight data');
        }
      });
    } else if (deviceType === DeviceType.BARCODE_SCANNER) {
      logger.info('Attaching barcode scanner handler');
      // Barcode parser chain: data → parsed line → validated code → domain event
      currentDevice.on('data', (data: Buffer) => parseHidData(data));
    }

    currentDevice.on('error', (err) => {
      logger.error({ error: err }, 'Device error');
      cleanupDevice(currentDevice);
    });
  } catch (err) {
    logger.error({ error: err }, 'Error during device setup');
  }
}

// === Device Lifecycle ===
hidEmitter.on('device:connected', (found) => {
  logger.info({ product: found.product }, 'Device connected event');
  setupDevice(found);
});

hidEmitter.on('device:reconnected', (found) => {
  logger.info({ product: found.product }, 'Device reconnected event');
  setupDevice(found);
});

hidEmitter.on('device:disconnected', () => {
  logger.info('Device disconnected');
  cleanupDevice(currentDevice);
});

// === Cleanup ===
function cleanupDevice(device: HID.HID | null): void {
  if (!device) return;
  device.removeAllListeners();
  try {
    device.close();
  } catch (err) {
    // Ignore close errors
  }
  if (device === currentDevice) currentDevice = null;
}

// === Graceful Shutdown ===
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  cleanupDevice(currentDevice);
  process.exit(0);
});
