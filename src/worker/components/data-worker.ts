import { db } from 'modules/db';
import { LoggerService } from 'modules/logger';
import { BaseWorker } from './base-worker';


const logger = new LoggerService('data-worker.ts', 'green');

export class DataWorker extends BaseWorker {
  static readonly worker = 'data-worker';
  static readonly period = 1;

  protected readonly worker = DataWorker.worker;

  async process() {
    await logger.info(`${DataWorker.worker} process started...`);

    if (!(await this.busy())) {
      await this.start();

      const items = await db.deleted();
      const today = new Date().getTime();

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.deleted && (!item.description || this.isOutdated(item.updated, today))) {
          logger.info('remove.item', item.title, item.created, item.updated);
          db.enqueue(item, 'remove');
        }
      }

      await db.dequeue();
      await this.finish();
    }

    await logger.info(`${DataWorker.worker} process finished.`);
  }

  private isOutdated(updated: number, today: number): boolean {
    const start = new Date(updated);
    const end = new Date(today);

    const first = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const second = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const millisecondsBetween = second.getTime() - first.getTime();
    const days = millisecondsBetween / millisecondsPerDay;

    return Math.floor(days) > this.settings.common.expirationDays;
  }
}
