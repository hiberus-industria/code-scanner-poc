type Symbology = 'Code128' | 'EAN-13' | 'EAN-8' | 'UPC-A' | 'UPC-E' | 'UNKNOWN';
function simbologyDetection(barcode: string): Symbology {
  const clean = barcode.trim().slice(1, -1);

  if (/^\d+$/.test(clean)) {
    if (clean.length === 12) return 'UPC-A';
    if (clean.length === 8) return 'EAN-8'; //o UPC-E
    if (clean.length === 13) return 'EAN-13';
  }

  if (/^[A-Za-z0-9]+$/.test(clean)) {
    return 'Code128';
  }

  return 'UNKNOWN';
}

function expandUpcEtoUpcA(upce: string): string {
  if (!/^\d{8}$/.test(upce)) throw new Error('Invalid UPC-E code');

  const arrayUpcE = upce.split('');
  const [n, m1, m2, m3, m4, m5, exp, checkDigit] = arrayUpcE;
  let body = '';

  switch (exp) {
    case '0':
    case '1':
    case '2':
      body = `${n}${m1}${m2}${exp}0000${m3}${m4}${m5}`;
      break;
    case '3':
      body = `${n}${m1}${m2}${m3}${m4}00000${m5}`;
      break;
    case '4':
      body = `${n}${m1}${m2}${m3}${m4}00000${m5}`;
      break;
    default:
      body = `${n}${m1}${m2}${m3}${m4}${m5}0000${exp}`;
      break;
  }

  const upca = body + checkDigit;
  if (upca.length !== 12) throw new Error('Error expansion code');
  return upca;
}

export function validateBarCode(barcode: string): void {
  console.log('PRINCIPAL');
}
