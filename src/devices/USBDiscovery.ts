import usb from 'usb';
import { Connection } from './conecction.js';
import { logger } from '../infra/logger.js';
import { EventEmitter } from 'events';

export const usbEmitter = new EventEmitter();

export class USBDiscovery extends Connection {
  private isConnected = false;
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
   */
  public connect(vendorId: number, productName: string): () => void {
    this.startSearch(vendorId, productName);
    return () => this.stop();
  }

  private startSearch(vendorId: number, productName: string): void {
    if (this.intervalId) return; // already searching

    this.intervalId = setInterval(async () => {
      const devices = await this.discover();
      const found = this.setDeviceInfo(devices, vendorId, productName);

      /**
       * Emit events based on device connection state
       */

      // --- Device disconnected ---
      if (this.isConnected && !found) {
        this.isConnected = false;

        logger.info({
          event: 'device_disconnected',
          deviceId: this.serialNumber,
        });

        usbEmitter.emit('device:disconnected');
        return;
      }

      if (!found) return;

      const foundSerial = found.deviceDescriptor.iSerialNumber?.toString();

      // --- Device reconnected ---
      if (!this.isConnected && this.serialNumber) {
        if (foundSerial === this.serialNumber) {
          this.isConnected = true;

          logger.info({
            event: 'device_reconnected',
            deviceId: foundSerial,
          });

          usbEmitter.emit('device:reconnected', found);
          this.stop();
          return;
        }
      }

      // --- First connection ---
      if (!this.isConnected) {
        this.isConnected = true;
        this.serialNumber = foundSerial;

        logger.info({
          event: 'device_connected',
          deviceId: this.serialNumber,
        });

        usbEmitter.emit('device:connected', found);
        this.stop();
      }
    }, 1000);
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
