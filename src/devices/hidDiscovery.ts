import HID from 'node-hid';

//Exportamos la función para listar todos los dispositivos con el vendorId introducido.
export async function listHidDevices(vendorId: number): Promise<void> {
  //Recogemos todos los dispositivos
  const devices = await HID.devicesAsync();

  //Filtramos por vendorId
  const filtered = devices.filter((device) => device.vendorId === vendorId);

  //Control si lo recoge quiero que me diga que no lo recoge si lo recoge que los muestre
  if (filtered.length === 0) {
    console.warn('No se ha encontrado ningun dispositivo');
  } else {
    console.log(filtered);
  }
}
