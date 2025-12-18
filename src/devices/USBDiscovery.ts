import usb from 'usb';
import { Connection } from './conecction.js';
import { logger } from '../infra/logger.js';
import { EventEmitter } from 'events';

export const usbEmitter = new EventEmitter();

class USBDiscovery extends Connection {
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
   * Retorna una función de limpieza
   */
  public connect(vendorId: number, productId: number): () => void {
    this.intervalId = setInterval(async () => {
      const devices = await this.discover();

      // Usa setDeviceInfo para filtrar y obtener el dispositivo que coincide
      const found = this.setDeviceInfo(devices, vendorId, productId);

      // --- Disconnected ---
      if (this.isConnected && !found) {
        this.isConnected = false;
        logger.info('USB device disconnected');
        usbEmitter.emit('device:disconnected');
        return;
      }

      if (!found) {
        return;
      }

      // --- Reconnected ---
      if (!this.isConnected && this.serialNumber) {
        if (this.serialNumber === this.serialNumber) {
          this.isConnected = true;
          logger.info({
            event: 'device_reconnected',
            deviceId: this.serialNumber,
          });
          usbEmitter.emit('device:reconnected', found);
          return;
        }
      }

      // --- Connected for the first time ---
      if (!this.isConnected) {
        this.isConnected = true;

        logger.info({
          event: 'device_connected',
          deviceId: this.serialNumber,
        });

        usbEmitter.emit('device:connected', found);
      }
    }, 1000);

    return () => this.stop();
  }

  /**
   * Detiene el escaneo
   */
  public stop(): void {
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

export default USBDiscovery;
