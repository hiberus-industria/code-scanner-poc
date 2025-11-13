import HID from 'node-hid';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { logger } from '../infra/logger.js';

export const hidEmitter = new EventEmitter();

let isConnected = false;
let serialNumber: string | undefined;
let intervalId: NodeJS.Timeout | null = null;

export function listHidDevices(vendorId: number, productName: string): () => void {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  intervalId = setInterval(async () => {
    let devices: HID.Device[] = [];

    try {
      devices = await HID.devicesAsync();
    } catch (e) {
      logger.error({ err: e }, 'Error scanning devices');
      return;
    }

    const filtered = devices.filter(
      (device) => device.vendorId === vendorId && device.product === productName
    );

    if (filtered.length === 0) {
      logger.warn('No HID devices found with the specified criteria.');
    }

    const found = filtered[0];

    // --- Disconnected ---
    if (isConnected && !found) {
      isConnected = false;
      // Keep serialNumber so we can reconnect later
      hidEmitter.emit('device:disconnected');
      return;
    }

    // If no device is found, there’s nothing else to do
    if (!found) {
      return;
    }

    // --- Reconnected ---
    if (!isConnected && serialNumber) {
      // If we have a saved serialNumber, compare it
      if (found.serialNumber === serialNumber) {
        isConnected = true;
        logger.info({ event: 'device_reconnected', deviceId: found.serialNumber });
        hidEmitter.emit('device:reconnect', found);
        return;
      }
    }

    // --- Connected for the first time ---
    if (!isConnected) {
      isConnected = true;
      serialNumber = found.serialNumber; // Save the serial number for future reconnections
      logger.info({ event: 'device_connected', deviceId: found.serialNumber });
      saveDevice(filtered);
      hidEmitter.emit('device:connected', found);
      return;
    }
  }, 1000);

  // Return cleanup function
  return () => {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function saveDevice(found: HID.Device[]): void {
  const jsonString = JSON.stringify(found, null, 2);
  const filePath = path.resolve('./devices.json');

  try {
    fs.writeFileSync(filePath, jsonString);
    logger.info(`Device information saved to ${filePath}`);
  } catch (err) {
    logger.error({ err }, 'Error writing file');
  }
}
