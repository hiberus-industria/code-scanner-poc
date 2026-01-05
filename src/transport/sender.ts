import axios from 'axios';
import { Queue } from './queue.js';
import { logger } from '../infra/logger.js';

const REQUEST_TIMEOUT = 5000;
const MAX_RETRIES = 3;
const CIRCUIT_PAUSE = 60000; // 10 segundos en lugar de 60

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class EventSender {
  private queue: Queue;
  private consecutiveFailures = 0;
  private circuitOpen = false;

  constructor(queue: Queue) {
    this.queue = queue;
  }

  public async start() {
    while (true) {
      if (this.circuitOpen) {
        logger.warn(`Circuit breaker open. Waiting ${CIRCUIT_PAUSE}ms before retry...`);
        await delay(CIRCUIT_PAUSE);
        this.circuitOpen = false;
        this.consecutiveFailures = 0;
        logger.info('Circuit breaker reset. Resuming event dispatch.');
        continue;
      }

      await this.queue.init(); // ensures db is loaded
      const event = await this.queue.getFirstEvent();
      if (!event) {
        await delay(500); // if there are no events, wait before checking again
        continue;
      }

      logger.info({ url: event.url, payload: event.payload }, 'Sending event from queue');
      let attempt = 0;
      while (attempt < MAX_RETRIES) {
        try {
          await axios.post(event.url, event.payload, { timeout: REQUEST_TIMEOUT });
          logger.info({ url: event.url }, 'Event sent successfully');
          await this.queue.dequeueEvent();
          this.consecutiveFailures = 0;
          break;
        } catch (error) {
          attempt++;
          this.consecutiveFailures++;
          logger.error(
            { url: event.url, attempt, consecutiveFailures: this.consecutiveFailures, error },
            `Failed to send event (attempt ${attempt}/${MAX_RETRIES})`
          );

          if (this.consecutiveFailures >= MAX_RETRIES) {
            this.circuitOpen = true;
            logger.warn(
              `Too many failed attempts (${this.consecutiveFailures}). Circuit breaker opened.`
            );
          } else if (attempt < MAX_RETRIES) {
            const delayMs = Math.pow(2, attempt) * 1000;
            logger.info({ delayMs }, `Retrying in ${delayMs}ms...`);
            await delay(delayMs);
          }
        }
      }
    }
  }
}
