import HID from 'node-hid';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import logger from '../infra/logger.js';

function saveDevice(found: HID.Device[]): void {
  const jsonString = JSON.stringify(found, null, 2);
  const filePath = path.resolve('./devices.json');

  try {
    fs.writeFileSync(filePath, jsonString);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    logger.info(`Device information saved to ${filePath}`);
  } catch (err) {
    console.error('Error writing file:', err);
  }
}

export const hidEmitter = new EventEmitter();

let isConnected = false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let currentPath: string | null = null;
let serialNumber: string | undefined;

let filtered: HID.Device[] = [];

export function listHidDevices(vendorId: number, productName: string): void {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  setInterval(async () => {
    let devices: HID.Device[] = [];

    try {
      devices = await HID.devicesAsync();
    } catch (e) {
      console.error('Error scanning devices:', e);
      return;
    }

    filtered = devices.filter(
      (device) => device.vendorId === vendorId && device.product === productName
    );

    if (filtered.length === 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      logger.warn('No se encontraron dispositivos HID con los criterios especificados.');
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      logger.info({ event: 'device_connected', deviceId: serialNumber });
    }

    const found = filtered[0];

    // --- Desconectado ---
    if (isConnected && !found) {
      console.warn('disconnect');
      isConnected = false;
      currentPath = null;
      // Mantenemos serialNumber para poder reconectar después
      hidEmitter.emit('device:disconnected');
      return;
    }

    // Si no hay dispositivo, no hay más que hacer
    if (!found) {
      return;
    }

    // --- Reconectado ---
    if (!isConnected && serialNumber) {
      // Si tenemos un serialNumber guardado, comparamos
      if (found.serialNumber === serialNumber) {
        console.warn('reconnect - matched by serial number');
        isConnected = true;
        currentPath = found.path ?? null;
        hidEmitter.emit('device:reconnect', found);
        return;
      }
    }

    // --- Conectado por primera vez ---
    if (!isConnected) {
      isConnected = true;
      currentPath = found.path ?? null;
      serialNumber = found.serialNumber; // Guardamos el serial para futuras reconexiones
      saveDevice(filtered);
      hidEmitter.emit('device:connected', found);
      return;
    }
  }, 1000);
}
