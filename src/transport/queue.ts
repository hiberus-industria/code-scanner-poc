import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

interface EventEntry {
  url: string;
  payload: EventPayload;
}

/**
 * Flexible payload: accepts any object structure from domain events
 * (barcode, weight, or any future device type)
 */
export type EventPayload = Record<string, unknown>;

export class Queue {
  private __filename = fileURLToPath(import.meta.url);
  private __dirname = path.dirname(this.__filename);
  private dbFile = path.join(this.__dirname, 'queue.json');
  private db = new Low<{ events: EventEntry[] }>(new JSONFile(this.dbFile), { events: [] });

  async init() {
    await this.db.read();

    if (!Array.isArray(this.db.data.events)) {
      this.db.data.events = [];
      this.db.write();
    }
  }

  async enqueueEvent(url: string, payload: EventPayload) {
    await this.init();
    this.db.data.events.push({ url: url, payload: payload });
    await this.db.write();
  }

  async getFirstEvent() {
    await this.init();
    return this.db.data.events[0];
  }

  async dequeueEvent() {
    await this.init();
    const event = this.db.data.events.shift();
    await this.db.write();
    return event;
  }
}
