import { EventEmitter } from 'events';
import HID from 'node-hid';

// Delay constants for reconnecting in case of error or device absence
const RECONNECT_DELAY_MS = 500; // Short delay after a disconnect
const RECONNECT_RETRY_DELAY_MS = 1000; // Longer delay if initial connection fails
const CARRIAGE_RETURN = 0x0d; // Hex value of \r
const ASCII_PRINTABLE_START = 0x20;
const ASCII_PRINTABLE_END = 0x7e;

export class HidReader extends EventEmitter {
  private device: HID.HID | null = null; // Reference to the connected HID device
  private buffer: Buffer = Buffer.alloc(0); // Buffer to accumulate incoming data
  private vendorId: number; // HID vendor ID
  private productName: string; // HID product name (string identifier)

  private flushTimer?: NodeJS.Timeout | undefined; // Timer to flush incomplete buffer
  private readonly FLUSH_TIMEOUT = 100; // Timeout to flush buffer if no CR received

  constructor(vendorId: number, productName: string) {
    super();
    this.vendorId = vendorId;
    this.productName = productName;
  }

  /**
   * Starts the HID reader by finding the matching device and registering data/error listeners.
   * Automatically retries on failure or disconnect.
   */
  start(): void {
    if (this.device) return;

    try {
      const devices = HID.devices();
      const found = devices.find(
        (d) => d.vendorId === this.vendorId && d.product === this.productName
      );

      if (!found?.path) {
        throw new Error('The HID device with the specified vendorId/productName was not found.');
      }

      this.device = new HID.HID(found.path);

      // Listen for incoming data and errors
      this.device.on('data', this.onData.bind(this));
      this.device.on('error', (err: Error) => {
        this.emit('error', err);
        this.stop();
        setTimeout(() => this.start(), RECONNECT_DELAY_MS);
      });
    } catch (err) {
      this.emit('error', err instanceof Error ? err : new Error(String(err)));
      setTimeout(() => this.start(), RECONNECT_RETRY_DELAY_MS);
    }
  }

  /**
   * Stops the HID reader by removing listeners, closing the device,
   * and clearing the internal buffer.
   */
  stop(): void {
    if (!this.device) return;
    this.device.removeAllListeners('data');
    this.device.removeAllListeners('error');
    this.device.close();
    this.device = null;
    this.buffer = Buffer.alloc(0);
  }

  /**
   * Private helper to clean and normalize a scanned line.
   * Removes null bytes, trims whitespace, and removes known HID prefixes/suffixes.
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
    let idx = this.buffer.indexOf(CARRIAGE_RETURN);

    // Process all complete lines in the buffer
    while (idx !== -1) {
      const line = this._cleanLine(this.buffer.subarray(0, idx));
      if (line.length) this.emit('scan:raw', line);

      this.buffer = Buffer.from(this.buffer.subarray(idx + 1));
      idx = this.buffer.indexOf(CARRIAGE_RETURN);
    }

    // Flush remaining buffer after a timeout if no CR received
    if (this.buffer.length > 0) {
      this.flushTimer = setTimeout(() => {
        if (this.buffer.length > 0) {
          const line = this._cleanLine(this.buffer);
          if (line.length) this.emit('scan:raw', line);
          this.buffer = Buffer.alloc(0);
        }
        this.flushTimer = undefined;
      }, this.FLUSH_TIMEOUT);
    }

    // Limit buffer size to avoid excessive memory usage
    const MAX_BUFFER = 16 * 1024;
    if (this.buffer.length > MAX_BUFFER) {
      this.buffer = Buffer.from(this.buffer.subarray(this.buffer.length - MAX_BUFFER));
    }
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

  /**
   * Cleans up the reader before destruction.
   * Flushes any remaining data and clears timers.
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = undefined;
    }
    if (this.buffer.length > 0) {
      const line = this._cleanLine(this.buffer);
      if (line.length) this.emit('scan:raw', line);
      this.buffer = Buffer.alloc(0);
    }
  }
}
