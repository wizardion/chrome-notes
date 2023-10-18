import { Logger } from 'modules/logger/logger';
import { ISettingsArea } from 'modules/settings/settings.model';


const logger: Logger = new Logger('base-worker.ts', 'green');

export class BaseWorker {
  static readonly worker: string;
  static readonly period: number;

  protected settings: ISettingsArea;

  constructor(settings: ISettingsArea) {
    this.settings = settings;
  }

  async process() {
    console.warn('Not Implemented');
  }

  static async register() {
    const process = await chrome.alarms.get(this.worker);

    if (process) {
      await chrome.alarms.clear(this.worker);
    }

    await chrome.alarms.create(this.worker, { periodInMinutes: this.period });
    logger.warn(`registered '${this.worker}' with period: ${this.period}`);
  }

  static async deregister() {
    await chrome.alarms.clear(this.worker);
    logger.warn(`terminated '${this.worker}'`);
  }
}
