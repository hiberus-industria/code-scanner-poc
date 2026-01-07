/**
 * Clase base para conexiones de dispositivos HID y USB
 */
export class Connection {
  protected deviceName: string | undefined;
  protected serialNumber: string | undefined;

  constructor(protected tipo: 'HID' | 'USB') {}

  protected setDeviceInfo(devices: any[], vendorId: number, productName: string): any | undefined {
    if (!devices || devices.length === 0) {
      return undefined;
    }

    const isHid = this.tipo === 'HID';

    const found = devices.find((device) =>
      isHid
        ? device.vendorId === vendorId && device.product === productName
        : device.deviceDescriptor?.idVendor === vendorId &&
          device.deviceDescriptor?.idProduct === productName
    );

    if (!found) return undefined;

    // Asignar metadatos solo si el dispositivo fue encontrado
    if (isHid) {
      this.deviceName = found.product;
      this.serialNumber = found.serialNumber;
    } else {
      this.deviceName = found.product ?? 'USB Device';
      this.serialNumber = found.serialNumber ?? null;
    }

    return found;
  }

  /**
   * Descubre dispositivos conectados
   */
  public discover(): Promise<any[]> {
    throw new Error('Method not implemented.');
  }

  /**
   * Desconecta del dispositivo
   */
  public disconnect() {
    throw new Error('Method not implemented.');
  }
}
