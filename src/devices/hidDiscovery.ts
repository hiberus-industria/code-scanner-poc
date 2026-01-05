import HID from 'node-hid';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { logger } from '../infra/logger.js';
import { Connection } from './conecction.js';

export const hidEmitter = new EventEmitter();

export class HidDevice extends Connection {
  private isConnected = false;
  private isSearching = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    super('HID');
  }

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
   * PAUSA cuando está conectado, REANUDA cuando se desconecta
   */
  public connect(vendorId: number, productName: string): () => void {
    this.startSearch(vendorId, productName);
    return () => this.stop();
  }

  private startSearch(vendorId: number, productName: string): void {
    if (this.isSearching) return;
    this.isSearching = true;

    this.intervalId = setInterval(async () => {
      const devices = await this.discover();
      const found = this.setDeviceInfo(devices, vendorId, productName);

      // --- Dispositivo desconectado ---
      if (this.isConnected && !found) {
        this.isConnected = false;
        logger.info({
          event: 'device_disconnected',
          deviceId: this.serialNumber,
        });
        hidEmitter.emit('device:disconnected');
        this.resumeSearch(vendorId, productName);
        return;
      }

      if (!found) {
        return;
      }

      // --- Dispositivo reconectado ---
      if (!this.isConnected && this.serialNumber) {
        if (found.serialNumber === this.serialNumber) {
          this.isConnected = true;
          logger.info({
            event: 'device_reconnected',
            deviceId: found.serialNumber,
          });
          hidEmitter.emit('device:reconnected', { ...found, connectionType: 'reconnected' });
          this.pauseSearch();
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

        this.saveDevice(devices, 'connected');
        hidEmitter.emit('device:connected', { ...found, connectionType: 'connected' });
        this.pauseSearch(); // Pausa aquí
      }
    }, 1000);
  }

  private pauseSearch(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isSearching = false;
      logger.debug('Device search paused - connected');
    }
  }

  private resumeSearch(vendorId: number, productName: string): void {
    logger.debug('Device search resumed - disconnected');
    this.startSearch(vendorId, productName);
  }

  private saveDevice(devices: HID.Device[], connectionType: 'connected' | 'reconnected'): void {
    const filePath = path.resolve('./devices.json');

    try {
      // Enriquecer datos con información de conexión
      const enrichedDevices = devices.map((device) => ({
        ...device,
        connectionType,
        savedAt: new Date().toISOString(),
      }));

      fs.writeFileSync(filePath, JSON.stringify(enrichedDevices, null, 2));
      logger.info({ filePath, connectionType }, 'Device information saved to devices.json');
    } catch (err) {
      logger.error({ err }, 'Error writing file');
    }
  }

  private stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isSearching = false;
    }
  }

  public override disconnect(): void {
    this.stop();
    this.isConnected = false;
  }
}
