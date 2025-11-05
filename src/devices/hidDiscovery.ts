import HID from 'node-hid';
import fs from 'fs';
import path from 'path';

function saveDevice(filtered: HID.Device[]): void {
  const jsonString = JSON.stringify(filtered, null, 2);
  const filePath = path.resolve('./devices.json');

  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, jsonString);
      return;
    }

    fs.writeFileSync('devices.json', jsonString);
  } catch (err) {
    console.error('Error writing file:', err);
  }
}

//We export the function to list all devices with the entered vendorId.
export async function listHidDevices(vendorId: number, productId: string): Promise<void> {
  //We collect all the devices

  let filtered: HID.Device[] = [];

  while (filtered.length === 0) {
    const devices = await HID.devicesAsync();
    filtered = devices.filter(
      (device) => device.vendorId === vendorId && device.product === productId
    );

    if (filtered.length > 0) {
      saveDevice(filtered);
      console.log('Dispositivo detectado');
      break;
    }
    console.warn('Dispositivo no detectado');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
