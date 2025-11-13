import { EventEmitter } from 'events';

const CARRIAGE_RETURN = 0x0d;
const ASCII_PRINTABLE_START = 0x20;
const ASCII_PRINTABLE_END = 0x7e;
const FLUSH_TIMEOUT = 100;

export const parserEmitter = new EventEmitter();
let buffer = Buffer.alloc(0);
let flushTimer: NodeJS.Timeout | undefined;

/** Cleans the buffer */
function cleanLine(raw: Buffer | string): string {
  return raw.toString('utf8').replace(/\x00/g, '').trim();
}

/** Returns completed lines */
export function processBuffer(): string[] {
  const MAX_BUFFER = 16 * 1024;
  if (buffer.length > MAX_BUFFER) {
    buffer = buffer.slice(buffer.length - MAX_BUFFER);
  }

  // Eliminar CRs iniciales
  while (buffer.length > 0 && buffer[0] === CARRIAGE_RETURN) {
    buffer = buffer.slice(1);
  }

  const lines: string[] = [];
  let crIndex: number;

  while ((crIndex = buffer.indexOf(CARRIAGE_RETURN)) >= 0) {
    const lineBuf = buffer.slice(0, crIndex);
    const line = cleanLine(lineBuf);

    if (line.length) {
      lines.push(line);
      parserEmitter.emit('raw:scan', line);
    }

    buffer = buffer.slice(crIndex + 1);
  }

  return lines;
}

/** Fuerza el procesamiento del buffer cuando expira el timeout */
function forceFlushBuffer(): void {
  if (buffer.length === 0) return;

  // Eliminar CRs iniciales
  while (buffer.length > 0 && buffer[0] === CARRIAGE_RETURN) {
    buffer = buffer.slice(1);
  }

  // Si aún hay contenido, procesarlo como una línea completa
  if (buffer.length > 0) {
    const line = cleanLine(buffer);

    if (line.length) {
      parserEmitter.emit('raw:scan', line);
    }
  }

  buffer = Buffer.alloc(0);
}

/**Returns parsed lines */
export function parseHidData(data: Buffer): string[] {
  const clean = Buffer.from(
    Array.from(data).filter(
      (b) => b === CARRIAGE_RETURN || (b >= ASCII_PRINTABLE_START && b <= ASCII_PRINTABLE_END)
    )
  );

  if (!clean.length) return [];

  buffer = Buffer.concat([buffer, clean]);

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = undefined;
  }

  // If CRs found -> process inmediately
  const lines = processBuffer();

  //If we have residual buffer, we program flush
  if (buffer.length > 0) {
    flushTimer = setTimeout(() => {
      forceFlushBuffer();
      flushTimer = undefined;
    }, FLUSH_TIMEOUT);
  }

  return lines;
}
