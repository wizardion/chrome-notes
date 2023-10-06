import { Logger } from 'modules/logger/logger';


const logger: Logger = new Logger('base-worker.ts', 'green');

export abstract class BaseWorker {
  static readonly worker: string;
  static readonly period: number;

  static async start() {
    const process: chrome.alarms.Alarm = await chrome.alarms.get(this.worker);

    if (process) {
      await chrome.alarms.clear(this.worker);
    }

    chrome.alarms.create(this.worker, { delayInMinutes: this.period });
    logger.warn(`started ${this.worker}`);
  }

  static async stop() {
    const process: chrome.alarms.Alarm = await chrome.alarms.get(this.worker);

    if (process) {
      await chrome.alarms.clear(this.worker);
      logger.warn(`terminated ${this.worker}`);
    }
  }

  static async process() {
    console.warn('Not Implemented');
  }
}
