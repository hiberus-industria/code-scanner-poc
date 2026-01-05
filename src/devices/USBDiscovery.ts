import usb from 'usb';
import { Connection } from './conecction.js';
import { logger } from '../infra/logger.js';
import { EventEmitter } from 'events';

export const usbEmitter = new EventEmitter();

export class USBDiscovery extends Connection {
  private isConnected = false;
  private isSearching = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    super('USB');
  }

  /**
   * Descubre todos los dispositivos USB conectados
   * Retorna la lista completa sin filtrar
   */
  public override async discover(): Promise<usb.Device[]> {
    try {
      return usb.getDeviceList();
    } catch (error) {
      logger.error({ err: error }, 'Error discovering USB devices');
      return [];
    }
  }

  /**
   * Inicia el escaneo periódico de dispositivos USB
   * PAUSA cuando está conectado, REANUDA cuando se desconecta
   * Retorna una función de limpieza
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

      // Usa setDeviceInfo para filtrar y obtener el dispositivo que coincide
      const found = this.setDeviceInfo(devices, vendorId, productName);

      // --- Dispositivo desconectado ---
      if (this.isConnected && !found) {
        this.isConnected = false;
        logger.info({
          event: 'device_disconnected',
          deviceId: this.serialNumber,
        });
        usbEmitter.emit('device:disconnected');
        this.resumeSearch(vendorId, productName);
        return;
      }

      if (!found) {
        return;
      }

      // --- Dispositivo reconectado ---
      if (!this.isConnected && this.serialNumber) {
        if (found.deviceDescriptor.iSerialNumber?.toString() === this.serialNumber) {
          this.isConnected = true;
          logger.info({
            event: 'device_reconnected',
            deviceId: found.deviceDescriptor.iSerialNumber?.toString(),
          });
          usbEmitter.emit('device:reconnected', found);
          this.pauseSearch(); // Pausa aquí
          return;
        }
      }

      // --- Primera conexión ---
      if (!this.isConnected) {
        this.isConnected = true;
        this.serialNumber = found.deviceDescriptor.iSerialNumber?.toString();

        logger.info({
          event: 'device_connected',
          deviceId: this.serialNumber,
        });

        usbEmitter.emit('device:connected', found);
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

  /**
   * Detiene el escaneo
   */
  public stop(): void {
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
