import { hidEmitter, listHidDevices } from './devices/hidDiscovery.js';
import { HidReader } from './devices/hidReader.js';
import { logger } from './infra/logger.js';

const vendorIdRaw = process.env['VENDOR_ID'];
if (!vendorIdRaw) throw new Error('VENDOR_ID must be set');
const vendorId = vendorIdRaw.trim().toLowerCase().startsWith('0x')
  ? parseInt(vendorIdRaw, 16)
  : parseInt(vendorIdRaw, 10);

if (Number.isNaN(vendorId)) {
  throw new Error(`VENDOR_ID is not a valid number: "${vendorIdRaw}"`);
}

const productIdRaw = process.env['PRODUCT_ID'];
if (!productIdRaw) throw new Error('PRODUCT_ID must be set');
const productId = productIdRaw.trim().toLowerCase().startsWith('0x')
  ? parseInt(productIdRaw, 16)
  : parseInt(productIdRaw, 10);

if (Number.isNaN(productId)) {
  throw new Error(`PRODUCT_ID is not a valid number: "${productIdRaw}"`);
}

const productName = process.env['PRODUCT'] ?? '';

const reader = new HidReader(vendorId, productId);

reader.on('scan:raw', (line) => {
  logger.info(`Código leído: ${line}`);
});

reader.on('error', (err) => {
  logger.error({ err }, 'Error en HID');
});

hidEmitter.on('device:connected', () => {
  logger.info('Event → Connected');
  reader.start();
});

hidEmitter.on('device:reconnect', () => {
  logger.info('Event → Reconnected');
  reader.start();
});

hidEmitter.on('device:disconnected', () => {
  logger.info('Event → Disconnected');
  reader.stop();
});

listHidDevices(vendorId, productName);

process.on('SIGINT', () => {
  reader.stop();
  process.exit(0);
});
