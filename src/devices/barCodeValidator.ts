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

// Constantes descriptivas
const ASCII_PRINTABLE_START = 32;
const ASCII_PRINTABLE_END = 126;
const CODE128_A_MAX = 95;
const MOD_10 = 10;

/*
 * DETECCIÓN DE SIMBOLOGÍA
 * Identifica el tipo de código de barras basado en su contenido
 */
function detectBarcodeSymbology(barcodeData: string): Symbology {
  const isOnlyNumeric = /^\d+$/.test(barcodeData);
  const barcodeLength = barcodeData.length;

  // GS1 AIM ID prefixes (estándar de scanners HID)
  if (barcodeData.startsWith(']C')) return 'Code128-C';
  if (barcodeData.startsWith(']A')) return 'Code128-A';
  if (barcodeData.startsWith(']B')) return 'Code128-B';

  // EAN-13: exactamente 13 dígitos
  if (isOnlyNumeric && barcodeLength === 13) return 'EAN-13';

  // UPC-A: exactamente 12 dígitos
  if (isOnlyNumeric && barcodeLength === 12) return 'UPC-A';

  // UPC-E: exactamente 8 dígitos, comienza con 0 o 1
  if (isOnlyNumeric && barcodeLength === 8 && (barcodeData[0] === '0' || barcodeData[0] === '1')) {
    const expansionDigit = Number(barcodeData[6]);
    if (expansionDigit >= 0 && expansionDigit <= 9) return 'UPC-E';
  }

  // EAN-8: exactamente 8 dígitos
  if (isOnlyNumeric && barcodeLength === 8) return 'EAN-8';

  // Code128-C: solo números con longitud par
  if (isOnlyNumeric && barcodeLength % 2 === 0) return 'Code128-C';

  // Code128-A: ASCII 32–95
  if (isValidCode128A(barcodeData)) return 'Code128-A';

  // Code128-B: ASCII 32–126
  if (isValidCode128B(barcodeData)) return 'Code128-B';

  return 'UNKNOWN';
}

/*
 * VALIDACIÓN CODE128-A
 * Verifica que todos los caracteres estén en rango válido (32–95)
 */
function isValidCode128A(barcodeData: string): boolean {
  for (let charIndex = 0; charIndex < barcodeData.length; charIndex++) {
    const charCode = barcodeData.charCodeAt(charIndex);
    if (charCode < ASCII_PRINTABLE_START || charCode > CODE128_A_MAX) {
      return false;
    }
  }
  return true;
}

/*
 * VALIDACIÓN CODE128-B
 * Verifica que todos los caracteres estén en rango válido (32–126)
 */
function isValidCode128B(barcodeData: string): boolean {
  for (let charIndex = 0; charIndex < barcodeData.length; charIndex++) {
    const charCode = barcodeData.charCodeAt(charIndex);
    if (charCode < ASCII_PRINTABLE_START || charCode > ASCII_PRINTABLE_END) {
      return false;
    }
  }
  return true;
}

/*
 * VALIDACIÓN CODE128-C
 * Verifica que sea solo números con longitud par
 */
function isValidCode128C(barcodeData: string): boolean {
  const isNumericOnly = /^\d+$/.test(barcodeData);
  const isEvenLength = barcodeData.length % 2 === 0;
  return isNumericOnly && isEvenLength;
}

/*
 * EXPANSIÓN UPC-E → UPC-A
 * Convierte formato comprimido UPC-E (8 dígitos) a formato UPC-A (12 dígitos)
 */
function expandUpcEtoUpcA(upcEBarcode: string): string {
  if (!/^\d{8}$/.test(upcEBarcode)) {
    throw new Error('Invalid UPC-E code: must be exactly 8 digits');
  }

  const [
    numberSystemDigit,
    manufacturer1,
    manufacturer2,
    manufacturer3,
    manufacturer4,
    manufacturer5,
    expansionDigit,
    checkDigit,
  ] = upcEBarcode.split('');

  // UPC-E solo válido para 0 o 1
  if (numberSystemDigit !== '0' && numberSystemDigit !== '1') {
    throw new Error('UPC-E must start with 0 or 1');
  }

  let manufacturerCode = '';

  // Expansión según dígito de expansión (posición 7)
  switch (expansionDigit) {
    case '0':
    case '1':
    case '2':
      manufacturerCode = `${numberSystemDigit}${manufacturer1}${manufacturer2}${expansionDigit}0000${manufacturer3}${manufacturer4}${manufacturer5}`;
      break;

    case '3':
      manufacturerCode = `${numberSystemDigit}${manufacturer1}${manufacturer2}${manufacturer3}00000${manufacturer4}${manufacturer5}`;
      break;

    case '4':
      manufacturerCode = `${numberSystemDigit}${manufacturer1}${manufacturer2}${manufacturer3}${manufacturer4}00000${manufacturer5}`;
      break;

    default:
      manufacturerCode = `${numberSystemDigit}${manufacturer1}${manufacturer2}${manufacturer3}${manufacturer4}${manufacturer5}0000${expansionDigit}`;
      break;
  }

  return manufacturerCode + checkDigit;
}

/*
 * CHECKSUM MOD10 (GS1)
 * Calcula checksum para EAN/UPC usando algoritmo MOD10
 * Algoritmo: desde la derecha, alterna multiplicadores 3 y 1
 */
function calculateMod10Checksum(barcodeData: string): number {
  const barcodeDigits = barcodeData.split('').map(Number);
  const dataWithoutCheckDigit = barcodeDigits.slice(0, -1);

  let checksumSum = 0;
  let multiplicador = 3;

  // Procesamos de derecha a izquierda
  for (let digitIndex = dataWithoutCheckDigit.length - 1; digitIndex >= 0; digitIndex--) {
    const currentDigit = dataWithoutCheckDigit[digitIndex] ?? 0;
    checksumSum += currentDigit * multiplicador;
    multiplicador = multiplicador === 3 ? 1 : 3;
  }

  const remainder = checksumSum % MOD_10;
  return (MOD_10 - remainder) % MOD_10;
}

/*
 * FUNCIÓN PRINCIPAL DE VALIDACIÓN
 * Detecta tipo de código y valida según reglas específicas
 */
export function validateBarCode(barcodeData: string): void {
  const symbologyType = detectBarcodeSymbology(barcodeData);
  let isValid = false;
  let errorMessage: string | undefined;

  try {
    switch (symbologyType) {
      case 'EAN-13':
      case 'EAN-8':
      case 'UPC-A': {
        const expectedCheckDigit = calculateMod10Checksum(barcodeData);
        const actualCheckDigit = Number(barcodeData.slice(-1));
        isValid = expectedCheckDigit === actualCheckDigit;
        break;
      }

      case 'UPC-E': {
        const expanded = expandUpcEtoUpcA(barcodeData);
        const expectedCheckDigit = calculateMod10Checksum(expanded);
        const actualCheckDigit = Number(barcodeData[7]);
        isValid = expectedCheckDigit === actualCheckDigit;
        break;
      }

      case 'Code128-A':
        isValid = isValidCode128A(barcodeData);
        break;

      case 'Code128-B':
        isValid = isValidCode128B(barcodeData);
        break;

      case 'Code128-C':
        isValid = isValidCode128C(barcodeData);
        break;

      case 'UNKNOWN':
        throw new Error(`Unsupported or unrecognized barcode format`);
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err);
    isValid = false;
    console.error(`Validation error for barcode "${barcodeData}": ${errorMessage}`);
  }
  const now = new Date();
  const ts = now.toLocaleString('es-ES');
  // Emitir un único evento con toda la información
  barCodeEmitter.emit('code:validated', {
    barcode: barcodeData,
    simbology: symbologyType,
    valid: isValid,
    ts,
    error: errorMessage,
  });
}
