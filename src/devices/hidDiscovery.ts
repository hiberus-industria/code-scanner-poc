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

  public override async discover(): Promise<HID.Device[]> {
    try {
      // Obtener la lista de dispositivos HID conectados
      return await HID.devicesAsync();
    } catch (error) {
      logger.error({ err: error }, 'Error discovering HID devices');
      return [];
    }
  }

  /**
   * Inicia el escaneo periódico de dispositivos HID
   * PAUSA cuando está conectado, REANUDA cuando se desconecta
   * Este metodo se encuentra en el INDEX.TS
   */
  public connect(vendorId: number, productName: string): () => void {
    this.startSearch(vendorId, productName);
    return () => this.stop();
  }

  private startSearch(vendorId: number, productName: string): void {
    if (this.intervalId) return; // is already searching

    this.intervalId = setInterval(async () => {
      const devices = await this.discover();
      const found = this.setDeviceInfo(devices, vendorId, productName);

      /**
       * Emmit events based on device connection state
       */

      // --- Device Disconnected ---
      if (this.isConnected && !found) {
        this.isConnected = false;
        logger.info({
          event: 'device_disconnected',
          deviceId: this.serialNumber,
        });
        hidEmitter.emit('device:disconnected');
        return;
      }

      if (!found) return;

      // --- Dispositivo reconectado ---
      if (!this.isConnected && this.serialNumber) {
        if (found.serialNumber === this.serialNumber) {
          this.isConnected = true;
          logger.info({
            event: 'device_reconnected',
            deviceId: found.serialNumber,
          });
          hidEmitter.emit('device:reconnected', { ...found, connectionType: 'reconnected' });
          this.stop();
          return;
        }
      }

      // --- Primera conexión ---
      if (!this.isConnected) {
        this.isConnected = true;
        this.serialNumber = found.serialNumber;

        logger.info({
          event: 'device_connected',
          deviceId: found.serialNumber,
        });

        this.saveDevice(devices);
        hidEmitter.emit('device:connected', { ...found, connectionType: 'connected' });
        this.stop();
      }
    }, 1000);
  }

  // Save device in JSON File
  private saveDevice(devices: HID.Device[]): void {
    const filePath = path.resolve('./devices.json');

    try {
      // Enriquecer datos con información de conexión;
      const fsSaveDevice = devices.map((device) => ({
        ...device,
        connectionType: 'HID',
        savedAt: new Date().toISOString(),
      }));

      fs.writeFileSync(filePath, JSON.stringify(fsSaveDevice, null, 2));
      logger.info({ filePath, connectionType: 'HID' }, 'Device information saved');
    } catch (err) {
      logger.error({ err }, 'Error writing file');
    }
  }

  private stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public override disconnect(): void {
    this.stop();
    this.isConnected = false;
  }
}
