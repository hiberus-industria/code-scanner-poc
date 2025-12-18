import HID from 'node-hid';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { logger } from '../infra/logger.js';
import { Connection } from './conecction.js';

export const hidEmitter = new EventEmitter();

export class HidDevice extends Connection {
  private isConnected = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    super('HID');
  }

  //Vamos a descubrir todos dispositivos por HID y retornar un array de dispositivos HID
  public override async discover(): Promise<HID.Device[]> {
    try {
      return await HID.devicesAsync();
    } catch (error) {
      logger.error({ err: error }, 'Error discovering HID devices');
      return [];
    }
  }

  /**
   * Inicia el escaneo periódico de dispositivos HID
   * Retorna una función de limpieza
   */
  public connect(vendorId: number, productName: string): () => void {
    this.intervalId = setInterval(async () => {
      let devices = await this.discover();

      // Usa setDeviceInfo para filtrar y obtener el dispositivo que coincide
      const found = this.setDeviceInfo(devices, vendorId, productName);

      // --- Disconnected ---
      if (this.isConnected && !found) {
        this.isConnected = false;
        hidEmitter.emit('device:disconnected');
        return;
      }

      if (!found) {
        return;
      }

      // --- Reconnected ---
      if (!this.isConnected && this.serialNumber) {
        if (found.serialNumber === this.serialNumber) {
          this.isConnected = true;
          logger.info({
            event: 'device_reconnected',
            deviceId: found.serialNumber,
          });
          hidEmitter.emit('device:reconnected', found);
          return;
        }
      }

      // --- Connected for the first time ---
      if (!this.isConnected) {
        this.isConnected = true;
        this.serialNumber = found.serialNumber;

        logger.info({
          event: 'device_connected',
          deviceId: found.serialNumber,
        });

        this.saveDevice(devices);
        hidEmitter.emit('device:connected', found);
      }
    }, 1000);

    return () => this.stop();
  }

  //Guardamos la información de los dispositivos en un archivo JSON
  private saveDevice(devices: HID.Device[]): void {
    const filePath = path.resolve('./devices.json');

    try {
      fs.writeFileSync(filePath, JSON.stringify(devices, null, 2));
      logger.info(`Device information saved to ${filePath}`);
    } catch (err) {
      logger.error({ err }, 'Error writing file');
    }
  }

  // Detenemos el escaneo periódico metodo privado
  private stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Desconecta del dispositivo
  public override disconnect(): void {
    this.stop();
    this.isConnected = false;
  }
}
