import { EventEmitter } from 'events';
import { logger } from '../infra/logger.js';

export const barCodeEmitter = new EventEmitter();

type Symbology =
  | 'Code128-A'
  | 'Code128-B'
  | 'Code128-C'
  | 'Code128-Other'
  | 'EAN-13'
  | 'EAN-8'
  | 'UPC-A'
  | 'UPC-E'
  | 'UNKNOWN';

/* =====================
   Helpers
===================== */

// Compute checksum for EAN/UPC codes
function computeEanUpcMod10(code: string): number {
  if (!code) return -1;
  const digits = code.split('').map(Number);
  const body = digits.slice(0, -1);
  let sum = 0;
  let weight = 3;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += (body[i] ?? 0) * weight;
    weight = weight === 3 ? 1 : 3;
  }
  return (10 - (sum % 10)) % 10;
}

// Expand UPC-E to UPC-A format for checksum validation
function expandUpcEtoUpcA(upcE: string): string {
  if (!upcE) return '';
  const [ns, m1, m2, m3, m4, m5, exp, check] = upcE.split('');
  switch (exp) {
    case '0':
    case '1':
    case '2':
      return `${ns}${m1}${m2}${exp}0000${m3}${m4}${m5}${check}`;
    case '3':
      return `${ns}${m1}${m2}${m3}00000${m4}${m5}${check}`;
    case '4':
      return `${ns}${m1}${m2}${m3}${m4}00000${m5}${check}`;
    default:
      return `${ns}${m1}${m2}${m3}${m4}${m5}0000${exp}${check}`;
  }
}

/* =====================
   Symbology detection
===================== */

// Detect barcode type based on prefix and content
function detectSymbology(input: string): Symbology {
  if (!input) return 'UNKNOWN';
  if (input.startsWith(']A')) return 'Code128-A';
  if (input.startsWith(']B')) return 'Code128-B';
  if (input.startsWith(']C')) return 'Code128-C';
  if (/^\][A-Z]/.test(input)) return 'Code128-Other';

  const isNumeric = /^\d+$/.test(input);
  if (isNumeric && input.length === 13) return 'EAN-13';
  if (isNumeric && input.length === 12) return 'UPC-A';
  if (isNumeric && input.length === 8) return 'EAN-8';
  if (isNumeric && input.length % 2 === 0) return 'Code128-C';

  return 'UNKNOWN';
}

/* =====================
   Keyboard-mode validation
===================== */

// Validate Code128 input based on set
function validateCode128(input: string, set: 'A' | 'B' | 'C' | 'Other'): boolean {
  if (!input) return false;

  let clean = input.startsWith(']') ? input.slice(2) : input;
  clean = clean.trim().replace(/\x00/g, '');
  if (!clean.length) return false;

  // Only allow printable chars expected for Code128
  const allowedChars = /^[A-Za-z0-9\-./]+$/;
  if (!allowedChars.test(clean)) {
    logger.warn({ barcode: input, set, reason: 'invalid chars' }, 'Code128 validation failed');
    return false;
  }

  // For C set: digits only and even length
  if (set === 'C' && (!/^\d+$/.test(clean) || clean.length % 2 !== 0)) {
    logger.warn(
      { barcode: input, set, reason: 'invalid C-set format' },
      'Code128 validation failed'
    );
    return false;
  }

  // For "Other": prefix must be uppercase letter
  if (set === 'Other' && !(input[1] ?? '').match(/^[A-Z]/)) {
    logger.warn(
      { barcode: input, set, reason: 'invalid Other prefix' },
      'Code128 validation failed'
    );
    return false;
  }

  return true;
}

/* =====================
   Public validator
===================== */

export function validateBarCode(barcodeData: string): void {
  if (!barcodeData) return;

  const detected = detectSymbology(barcodeData);
  let valid = false,
    error: string | undefined;

  try {
    switch (detected) {
      case 'EAN-13':
      case 'EAN-8':
      case 'UPC-A':
        valid = computeEanUpcMod10(barcodeData) === Number(barcodeData.slice(-1));
        if (!valid) logger.warn({ barcode: barcodeData, symbology: detected }, 'Checksum mismatch');
        break;
      case 'UPC-E':
        valid = computeEanUpcMod10(expandUpcEtoUpcA(barcodeData)) === Number(barcodeData.slice(-1));
        if (!valid) logger.warn({ barcode: barcodeData, symbology: detected }, 'Checksum mismatch');
        break;
      case 'Code128-A':
        valid = validateCode128(barcodeData, 'A');
        break;
      case 'Code128-B':
        valid = validateCode128(barcodeData, 'B');
        break;
      case 'Code128-C':
        valid = validateCode128(barcodeData, 'C');
        break;
      case 'Code128-Other':
        valid = validateCode128(barcodeData, 'Other');
        break;
      default:
        valid = false;
        error = 'Unsupported barcode format';
        logger.warn({ barcode: barcodeData, symbology: detected, error }, 'Unsupported barcode');
    }
  } catch (e) {
    valid = false;
    error = e instanceof Error ? e.message : String(e);
    logger.warn(
      { barcode: barcodeData, symbology: detected, error },
      'Barcode validation exception'
    );
  }

  barCodeEmitter.emit('code:validated', {
    simbology: detected,
    valid,
    error,
  });
}
