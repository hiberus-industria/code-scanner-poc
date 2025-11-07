import { hidEmitter, listHidDevices } from './devices/hidDiscovery.js';
import { logger } from './infra/logger.js';

const vendorIdRaw = process.env['VENDOR_ID'];
if (vendorIdRaw === undefined || vendorIdRaw.trim() === '' || Number.isNaN(Number(vendorIdRaw))) {
  throw new Error('VENDOR_ID environment variable must be set to a valid integer string.');
}
const vendorId = parseInt(vendorIdRaw, 10);
const productId = process.env['PRODUCT'] ?? '';

hidEmitter.on('device:connected', () => {
  logger.info('Event → Connected');
});

hidEmitter.on('device:reconnect', () => {
  logger.info('Event → Reconnected');
});

hidEmitter.on('device:disconnected', () => {
  logger.info('Event → Disconnected');
});

listHidDevices(vendorId, productId);
