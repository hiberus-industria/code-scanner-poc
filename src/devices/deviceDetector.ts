import { logger } from '../infra/logger.js';

/**
 * Tipos de dispositivos HID
 * Usage Page 0x8C — Bar Code Scanner
 * Usage Page 0x8D — Weighing Devices
 */
export enum DeviceType {
  BARCODE_SCANNER = 'barcode_scanner',
  WEIGHING_DEVICE = 'weighing_device',
  UNKNOWN = 'unknown',
}

/**
 * Detecta si un dispositivo es un lector de código de barras o una báscula
 * basándose en Usage Page y Usage ID
 */
export function detectDeviceType(device: any): DeviceType {
  const usagePage = device.usagePage;
  const usage = device.usage;
  logger.debug(
    {
      vendor: device.vendorId || device.deviceDescriptor?.idVendor,
      product: device.productId || device.deviceDescriptor?.idProduct,
      usagePage,
      usage,
    },
    'Analyzing device'
  );

  // Bar Code Scanner: Usage Page 0x8C (140 decimal), Usage 0x02 (2 decimal)
  if (usagePage === 0x8c && usage === 0x02) {
    return DeviceType.BARCODE_SCANNER;
  }

  // Weighing Devices: Usage Page 0x8D (141 decimal)
  if (usagePage === 0x8d) {
    return DeviceType.WEIGHING_DEVICE;
  }

  // Heurística por nombre de producto
  const product = (device.product || '').toLowerCase();
  const manufacturer = (device.manufacturer || '').toLowerCase();

  if (
    product.includes('barcode') ||
    product.includes('scanner') ||
    product.includes('voyager') ||
    manufacturer.includes('honeywell')
  ) {
    return DeviceType.BARCODE_SCANNER;
  }

  if (product.includes('scale') || product.includes('weight')) {
    return DeviceType.WEIGHING_DEVICE;
  }

  return DeviceType.UNKNOWN;
}
