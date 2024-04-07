import { db } from 'modules/db';
import { LoggerService } from 'modules/logger';
import { BaseWorker } from './base-worker';
import { Cloud } from 'modules/sync/cloud';
import { finishProcess, startProcess } from 'modules/sync/components/process';


const logger = new LoggerService('data-worker.ts', 'green');

export class DataWorker extends BaseWorker {
  static readonly worker = 'data-worker';
  static readonly period = 1;

  async process() {
    logger.info(`${DataWorker.worker} process started...`);

    if (!(await Cloud.busy())) {
      await startProcess();

      const items = await db.deleted();
      const today = new Date().getTime();

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.deleted &&
          (this.days(item.updated, today) > this.settings.common.expirationDays || !item.description)) {
          logger.info('enqueue.item', [item.title, item.created, item.updated]);
          db.enqueue(item, 'remove');
        }
      }

      await db.dequeue();
      await finishProcess();
    } else {
      await logger.info(`${DataWorker.worker} is busy`);
    }

    logger.info(`${DataWorker.worker} process finished.`);
  }

  private days(updated: number, today: number) {
    const start = new Date(updated);
    const end = new Date(today);

    const first = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const second = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const millisecondsBetween = second.getTime() - first.getTime();
    const days = millisecondsBetween / millisecondsPerDay;

    return Math.floor(days);
  }
}
