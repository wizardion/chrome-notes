import { LoggerService } from 'modules/logger';
import { ISettingsArea } from 'modules/settings/models/settings.model';
import { IWorkerInfo, TerminateProcess } from './models/models';


const logger = new LoggerService('base-worker.ts', 'green');

export class BaseWorker {
  static readonly worker: string;
  static readonly period: number;

  protected settings: ISettingsArea;
  protected readonly worker: string;

  constructor(settings: ISettingsArea) {
    this.settings = settings;
  }

  protected async start(): Promise<void> {
    const processId: number = new Date().getTime();

    return chrome.storage.session.set({ syncProcessing: { id: processId, worker: this.worker } });
  }

  protected async finish(): Promise<void> {
    return chrome.storage.session.set({ syncProcessing: null });
  }

  protected async busy(): Promise<boolean> {
    const process: IWorkerInfo = (await chrome.storage.session.get('syncProcessing')).syncProcessing;

    if (process) {
      const hours = Math.abs(new Date().getTime() - process.id) / 36e5;

      await logger.info(`- ${this.worker}: the process '${process.worker}' is busy ...`);

      if (hours > 16) {
        throw new TerminateProcess(
          process.worker,
          `the process '${process.worker}' is hanging for ${hours} hours, terminate!`
        );
      }

      return true;
    }

    return false;
  }

  async process(): Promise<void> {
    console.warn('Not Implemented');
  }

  static async register(): Promise<void> {
    const process = await chrome.alarms.get(this.worker);

    if (process) {
      await chrome.alarms.clear(this.worker);
    }

    await chrome.alarms.create(this.worker, { periodInMinutes: this.period });
    logger.warn(`registered '${this.worker}' with period: ${this.period}`);
  }

  static async deregister(): Promise<void> {
    await chrome.alarms.clear(this.worker);
    logger.warn(`terminated '${this.worker}'`);
  }
}
