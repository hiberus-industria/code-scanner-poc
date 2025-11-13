import { EventEmitter } from 'events';

export const barCodeEmitter = new EventEmitter();

type Symbology =
  | 'Code128-A'
  | 'Code128-B'
  | 'Code128-C'
  | 'EAN-13'
  | 'EAN-8'
  | 'UPC-A'
  | 'UPC-E'
  | 'UNKNOWN';

function simbologyDetection(barcode: string): Symbology {
  const clean = barcode.trim().slice(1, -1);

  if (/^\d+$/.test(clean)) {
    if (clean.length === 12) return 'UPC-A';
    if (clean.length === 8) return 'EAN-8'; //o UPC-E
    if (clean.length === 13) return 'EAN-13';
  }

  if (/^\d+$/.test(clean) && clean.length % 2 === 0) {
    return 'Code128-C';
  }

  let isCode128A = true;
  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    if (charCode < 32) return 'Code128-A';
    if (charCode > 95) isCode128A = false;
  }
  if (isCode128A) return 'Code128-A';

  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    if (charCode < 32 || charCode > 126) return 'UNKNOWN';
  }
  return 'Code128-B';
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

function mod10CheckSum(barcode: string): number {
  const digits = barcode.split('').map(Number);
  const codeData = digits.slice(0, -1);
  let suma = 0;

  for (let i = 0; i < codeData.length; i++) {
    const posFromRight = codeData.length - i;
    const numberMultiply = posFromRight % 2 === 0 ? 3 : 1;

    suma += (codeData[i] ?? 0) * numberMultiply;
  }

  const remainder = suma % 10;
  return (10 - remainder) % 10;
}

function checkSumCode128A(barcode: string): number {
  const startCodeValue = 103;

  const values: number[] = [];

  for (let i = 0; i < barcode.length; i++) {
    const charCode = barcode.charCodeAt(i);

    if (charCode < 0 || charCode > 95) {
      throw new Error('Invalid character for Code 128A');
    }
    values.push(charCode);
  }

  let sumaCodeA = startCodeValue;
  for (let i = 0; i < values.length; i++) {
    sumaCodeA += (values[i] ?? 0) * (i + 1);
  }

  return sumaCodeA % 103;
}

function checkSumCode128B(barcode: string): number {
  const startCodeValue = 104;

  const values: number[] = [];

  for (let i = 0; i < barcode.length; i++) {
    const charCode = barcode.charCodeAt(i);

    if (charCode < 32 || charCode > 126) {
      throw new Error('Invalid character for Code 128B');
    }
    values.push(charCode - 32);
  }

  let sumaCodeB = startCodeValue;
  for (let i = 0; i < values.length; i++) {
    sumaCodeB += (values[i] ?? 0) * (i + 1);
  }

  return sumaCodeB % 103;
}

function validateCode128C(barcode: string): number {
  const startCodeValue = 105;
  const stopValue = 106;
  const chars = barcode.split('').map((n) => Number(n));

  if (!/^\d+$/.test(barcode)) {
    throw new Error('Invalid characters for Code 128C');
  }

  if (chars.length % 2 !== 0) {
    throw new Error('Code 128C must have an even number of digits');
  }

  if (chars[0] !== startCodeValue || chars[chars.length - 1] !== stopValue) {
    throw new Error('Invalid start/stop code in Code 128C');
  }

  const values: number[] = [];
  for (let i = 0; i < chars.length; i += 2) {
    const pair = chars.slice(i, i + 2);
    values.push(parseInt(pair.join(''), 10));
  }

  let checksum = startCodeValue;

  for (let i = 0; i < values.length; i++) {
    checksum += (chars[i] ?? 0) * (i + 1);
  }

  return checksum % 103;
}

export function validateBarCode(barcode: string): void {
  barcode = barcode.trim().slice(1, -1); // Remove start/stop characters
  const type = simbologyDetection(barcode); //Pick code symbology
  let valid = false;

  try {
    if (['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E'].includes(type)) {
      let toValidateCode = barcode;

      if (type === 'UPC-E') {
        toValidateCode = expandUpcEtoUpcA(barcode);
      }

      const checkSumMod10 = mod10CheckSum(toValidateCode);
      const actual = Number(barcode.slice(-1));
      valid = checkSumMod10 === actual;
    } else if (['Code128-A', 'Code128-B', 'Code128-C'].includes(type)) {
      let checkSum: number;
      let actual: number;
      switch (type) {
        case 'Code128-A':
          checkSum = checkSumCode128A(barcode);
          actual = Number(barcode.charCodeAt(barcode.length - 1));
          valid = checkSum === actual;
          break;
        case 'Code128-B':
          checkSum = checkSumCode128B(barcode);
          actual = Number(barcode.charCodeAt(barcode.length - 1)) - 32;
          valid = checkSum === actual;
          break;
        case 'Code128-C':
          checkSum = validateCode128C(barcode);
          actual = Number(barcode.charCodeAt(barcode.length - 1));
          valid = checkSum === actual;
          break;
      }

      barCodeEmitter.emit('code:valideted', {
        barcode,
        simbology: type,
        valid,
      });
    } else {
      throw new Error('Unsupported symbology for validation');
    }
  } catch (err) {
    console.error(`Validation error for ${barcode}:`, (err as Error).message);
  }
}
