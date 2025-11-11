import { EventEmitter } from 'events';
import HID from 'node-hid';

// Delay constants for reconnecting in case of error or device absence
const CARRIAGE_RETURN = 0x0d; // Hex value of \r
const ASCII_PRINTABLE_START = 0x20;
const ASCII_PRINTABLE_END = 0x7e;

export class HidReader extends EventEmitter {
  private device: HID.HID | null = null; // Reference to the connected HID device
  private buffer: Buffer = Buffer.alloc(0); // Buffer to accumulate incoming data
  private flushTimer?: NodeJS.Timeout | undefined; // Timer to flush incomplete buffer
  private readonly FLUSH_TIMEOUT = 100; // Timeout to flush buffer if no CR received

  constructor() {
    super();
  }

  read(found: HID.Device): void {
    if (!found.path) {
      throw new Error('Device path not found');
    }

    this.device = new HID.HID(found.path);

    this.device.on('data', (data: Buffer) => this.onData(data));
  }

  /**
   * Private helper to clean and normalize a scanned line.
   * Removes null bytes, trims whitespace
   */
  private _cleanLine(raw: Buffer | string): string {
    return raw
      .toString('utf8')
      .replace(/\x00/g, '') // remove null bytes
      .trim(); // trim surrounding whitespac
  }

  /**
   * Processes the internal buffer to extract complete lines terminated by CR (0x0D).
   * Cleans each line and emits 'scan:raw' event.
   * Also handles flushing partial lines and limiting buffer size.
   */
  private _processBuffer(): void {
    const MAX_BUFFER = 16 * 1024;

    // limits buffer
    if (this.buffer.length > MAX_BUFFER) {
      this.buffer = Buffer.from(this.buffer.subarray(this.buffer.length - MAX_BUFFER));
    }

    if (this.flushTimer) clearTimeout(this.flushTimer);

    this.flushTimer = setTimeout(() => {
      const parts = this.buffer.toString().split(String.fromCharCode(CARRIAGE_RETURN));

      for (const part of parts) {
        const line = this._cleanLine(Buffer.from(part));
        if (line.length) this.emit('scan:raw', line);
      }

      this.buffer = Buffer.alloc(0);
      this.flushTimer = undefined;
    }, this.FLUSH_TIMEOUT);
  }

  /**
   * Event handler for incoming HID data.
   * Filters non-printable characters, appends to buffer, and processes lines.
   */
  private onData(data: Buffer): void {
    // Keep only printable ASCII characters and CR (0x0D)
    const clean = Buffer.from(
      Array.from(data).filter(
        (b) => b === CARRIAGE_RETURN || (b >= ASCII_PRINTABLE_START && b <= ASCII_PRINTABLE_END)
      )
    );
    if (!clean.length) return;

    this.buffer = Buffer.concat([this.buffer, clean]);

    // Reset flush timer if new data arrives
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }

    this._processBuffer();
  }
}
