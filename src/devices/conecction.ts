/**
 * Clase base para conexiones de dispositivos HID y USB
 */
export class Connection {
  protected deviceName: string | undefined;
  protected serialNumber: string | undefined;

  constructor(
    protected codigo: string,
    protected tipo: 'HID' | 'USB'
  ) {}

  protected setDeviceInfo(
    devices: any[],
    vendorId: number,
    productId: string | number
  ): any | undefined {
    if (!devices || devices.length === 0) {
      return undefined;
    }

    const isHid = this.tipo === 'HID';

    //Si los dispositivos se han encontrado, buscamos cual coincide con los datos.
    const found = devices.find((device) =>
      isHid
        ? device.vendorId === vendorId && device.product === productId
        : device.deviceDescriptor?.idVendor === vendorId &&
          device.deviceDescriptor?.idProduct === productId
    );

    if (!found) return undefined;

    if (found) {
      if (this.tipo === 'HID') {
        this.deviceName = found.product;
        this.serialNumber = found.serialNumber;
      } else {
        this.deviceName = `USB Device ${found.deviceDescriptor.idVendor.toString(16)}:${found.deviceDescriptor.idProduct.toString(16)}`;
        this.serialNumber = found.deviceDescriptor.iSerialNumber?.toString();
      }
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
