import { LoggerService } from 'modules/logger';
import { ISettingsArea } from 'modules/settings/models/settings.model';
import { TerminateProcess, IWorkerInfo } from '../models/models';


export const workerLogger = new LoggerService('base-worker.ts', 'green');

export class BaseWorker {
  static readonly name: string;
  static readonly period: number;
  static readonly minGap = 3;
  static readonly maxGap = 25;

  readonly name: string;
  protected settings: ISettingsArea;
  protected busyWorker: string;

  constructor(settings: ISettingsArea) {
    this.settings = settings;
  }

  async start(): Promise<void> {
    const processId: number = new Date().getTime();

    await workerLogger.info(`${this.name} process started...`);

    return chrome.storage.session.set({ workerProcessing: { id: processId, worker: this.name } });
  }

  async finish(): Promise<void> {
    await workerLogger.info(`${this.name} process finished.`);

    return chrome.storage.session.set({ workerProcessing: null });
  }

  async busy(): Promise<boolean> {
    const process: IWorkerInfo = (await chrome.storage.session.get('workerProcessing')).workerProcessing;

    if (process) {
      const hours = Math.abs(new Date().getTime() - process.id) / 36e5;

      this.busyWorker = process.worker;
      await workerLogger.info(`- ${this.name}: the process '${process.worker}' is busy ...`);

      if (hours >= 24) {
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
    throw new Error('Not Implemented');
  }

  static async register(): Promise<void> {
    const period = this.period + Math.floor(Math.random() * (this.maxGap - this.minGap) + this.minGap);
    const process = await chrome.alarms.get(this.name);

    if (process) {
      await chrome.alarms.clear(this.name);
    }

    await chrome.alarms.create(this.name, { periodInMinutes: period });
    workerLogger.warn(`registered '${this.name}' with period: ${period}`);
  }

  static async deregister(reason: string = '...'): Promise<void> {
    const process = await chrome.alarms.get(this.name);

    if (process) {
      await chrome.alarms.clear(this.name);
      await workerLogger.warn(`terminated '${this.name}', reason: ${reason}`);
    }
  }
}
