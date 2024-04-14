import { LoggerService } from 'modules/logger';
import { ISettingsArea } from 'modules/settings/models/settings.model';
import { IWorkerInfo, TerminateProcess } from './models/models';


const logger = new LoggerService('base-worker.ts', 'green');

export class BaseWorker {
  static readonly name: string;
  static readonly period: number;
  static readonly minGap = 3;
  static readonly maxGap = 25;

  readonly name: string;
  protected settings: ISettingsArea;

  constructor(settings: ISettingsArea) {
    this.settings = settings;
  }

  protected async start(): Promise<void> {
    const processId: number = new Date().getTime();

    await logger.info(`${this.name} process started...`);

    return chrome.storage.session.set({ syncProcessing: { id: processId, worker: this.name } });
  }

  protected async finish(): Promise<void> {
    await logger.info(`${this.name} process finished.`);

    return chrome.storage.session.set({ syncProcessing: null });
  }

  protected async busy(): Promise<boolean> {
    const process: IWorkerInfo = (await chrome.storage.session.get('syncProcessing')).syncProcessing;

    if (process) {
      const hours = Math.abs(new Date().getTime() - process.id) / 36e5;

      await logger.info(`- ${this.name}: the process '${process.worker}' is busy ...`);

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
    // const period = this.period + Math.floor(Math.random() * (this.maxGap - this.minGap) + this.minGap);
    const period = this.period + 0;
    const process = await chrome.alarms.get(this.name);

    if (process) {
      await chrome.alarms.clear(this.name);
    }

    await chrome.alarms.create(this.name, { periodInMinutes: period });
    logger.warn(`registered '${this.name}' with period: ${period}`);
  }

  static async deregister(): Promise<void> {
    await chrome.alarms.clear(this.name);
    logger.warn(`terminated '${this.name}'`);
  }

  // static async run() {
  //   const process = await chrome.alarms.get(this.name);
  // }
}
