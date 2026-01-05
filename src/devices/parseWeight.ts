import { logger } from '../infra/logger.js';

/**
 * Interfaz para el resultado del parseo de peso
 */
export interface ParsedWeight {
  weight: number;
  unit: string;
  raw: string;
  isValid: boolean;
  error?: string;
}

/**
 * Convierte datos hexadecimales o binarios a ASCII
 * @param data - Buffer o string hexadecimal
 * @returns string en ASCII
 */
export function convertHexToAscii(data: Buffer | string): string {
  try {
    if (typeof data === 'string') {
      // Si es string, verificar si es hexadecimal
      if (/^[0-9a-fA-F]*$/.test(data) && data.length % 2 === 0) {
        const buffer = Buffer.from(data, 'hex');
        return buffer.toString('ascii');
      }
      return data;
    }

    // Si es Buffer
    return data.toString('ascii');
  } catch (error) {
    logger.error({ error }, 'Error converting hex to ASCII');
    return '';
  }
}

/**
 * Convierte datos binarios a ASCII
 * @param data - string binario (ej: "01100001")
 * @returns string en ASCII
 */
export function convertBinaryToAscii(data: string): string {
  try {
    // Validar que es binario
    if (!/^[01]+$/.test(data)) {
      return data;
    }

    // Dividir en bytes de 8 bits
    const bytes: number[] = [];
    for (let i = 0; i < data.length; i += 8) {
      const byte = data.substring(i, i + 8);
      if (byte.length === 8) {
        bytes.push(parseInt(byte, 2));
      }
    }

    // Convertir a ASCII
    return String.fromCharCode(...bytes);
  } catch (error) {
    logger.error({ error }, 'Error converting binary to ASCII');
    return '';
  }
}

/**
 * Normaliza el dato de entrada (hexadecimal, binario o ASCII)
 * @param rawData - Dato recibido de la báscula
 * @returns string normalizado a ASCII
 */
export function normalizeWeightData(rawData: Buffer | string): string {
  if (typeof rawData === 'string') {
    // Si es string, verificar si es hexadecimal
    if (/^[0-9a-fA-F]{2,}$/.test(rawData) && rawData.length % 2 === 0) {
      return convertHexToAscii(rawData);
    }

    // Verificar si es binario
    if (/^[01]{8,}$/.test(rawData) && rawData.length % 8 === 0) {
      return convertBinaryToAscii(rawData);
    }

    // Si no es hex ni binario, asumir que es ASCII
    return rawData;
  }

  // Si es Buffer, convertir a ASCII
  return convertHexToAscii(rawData);
}

/**
 * Expresión regular para extraer peso de la cadena ASCII
 * Captura: número decimal opcional + dígitos con punto decimal + unidades
 * Ejemplos válidos:
 * - "250.5 g"
 * - "1.250 kg"
 * - "GW:125.5 g"
 * - "Weight: 1250 mg"
 * - "125.50"
 */
const WEIGHT_REGEX = /(?:GW:|Weight:|Peso:|W:)?[\s]*(\d+\.?\d*)\s*([a-zA-Z]*)/;

/**
 * Extrae el peso de una cadena ASCII usando expresión regular
 * @param asciiData - string en formato ASCII
 * @returns ParsedWeight con peso, unidad y validez
 */
export function extractWeight(asciiData: string): ParsedWeight {
  const cleanData = asciiData.trim();

  try {
    const match = cleanData.match(WEIGHT_REGEX);

    if (!match || !match[1]) {
      return {
        weight: 0,
        unit: '',
        raw: cleanData,
        isValid: false,
        error: 'No se encontró un peso válido en los datos',
      };
    }

    const weight = parseFloat(match[1]);
    const unit = (match[2] || 'g').trim(); // Asumir gramos si no hay unidad

    if (isNaN(weight) || weight < 0) {
      return {
        weight: 0,
        unit: '',
        raw: cleanData,
        isValid: false,
        error: 'El peso extraído no es un número válido',
      };
    }

    return {
      weight,
      unit,
      raw: cleanData,
      isValid: true,
    };
  } catch (error) {
    logger.error({ error, data: asciiData }, 'Error extracting weight');
    return {
      weight: 0,
      unit: '',
      raw: cleanData,
      isValid: false,
      error: 'Error al procesar los datos de la báscula',
    };
  }
}

/**
 * Parsea datos de una báscula (hexadecimal, binario o ASCII)
 * Proceso completo: Normalizar → Extraer peso → Validar
 *
 * @param rawData - Datos recibidos de la báscula
 * @returns ParsedWeight con información completa
 */
export function parseWeight(rawData: Buffer | string): ParsedWeight {
  try {
    // Paso 1: Normalizar (hex/binario → ASCII)
    const asciiData = normalizeWeightData(rawData);

    if (!asciiData) {
      return {
        weight: 0,
        unit: '',
        raw: typeof rawData === 'string' ? rawData : rawData.toString('hex'),
        isValid: false,
        error: 'No se pudo convertir los datos a ASCII',
      };
    }

    logger.debug(
      { raw: typeof rawData === 'string' ? rawData : rawData.toString('hex'), ascii: asciiData },
      'Weight data normalized'
    );

    // Paso 2: Extraer peso
    const result = extractWeight(asciiData);

    if (result.isValid) {
      logger.info({ weight: result.weight, unit: result.unit }, 'Weight extracted successfully');
    } else {
      logger.warn({ data: asciiData, error: result.error }, 'Failed to extract weight');
    }

    return result;
  } catch (error) {
    logger.error({ error, data: rawData }, 'Unexpected error parsing weight');
    return {
      weight: 0,
      unit: '',
      raw: typeof rawData === 'string' ? rawData : rawData.toString('hex'),
      isValid: false,
      error: 'Error inesperado al procesar el peso',
    };
  }
}

/**
 * Convierte peso a una unidad estándar (gramos)
 * @param weight - peso numérico
 * @param unit - unidad original (g, kg, mg, lb, oz)
 * @returns peso en gramos
 */
export function convertToGrams(weight: number, unit: string): number {
  const u = unit.toLowerCase().trim();

  const conversions: Record<string, number> = {
    g: 1,
    gram: 1,
    grams: 1,
    kg: 1000,
    kilogram: 1000,
    kilograms: 1000,
    mg: 0.001,
    milligram: 0.001,
    milligrams: 0.001,
    lb: 453.592,
    lbs: 453.592,
    pound: 453.592,
    pounds: 453.592,
    oz: 28.3495,
    ounce: 28.3495,
    ounces: 28.3495,
  };

  return weight * (conversions[u] || 1);
}
