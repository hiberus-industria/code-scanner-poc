import HID from 'node-hid';

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export async function listHidDevices() {
  const devices = await HID.devicesAsync();
  console.log(devices);
}
