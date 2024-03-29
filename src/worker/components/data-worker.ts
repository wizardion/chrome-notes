import { db } from 'modules/db';
import { LoggerService } from 'modules/logger';
import { BaseWorker } from './base-worker';


const logger = new LoggerService('data-worker.ts', 'green');

export class DataWorker extends BaseWorker {
  static readonly worker = 'data-worker';
  static readonly period = 60;

  async process() {
    const items = await db.deleted();
    const today = new Date().getTime();

    logger.info('deleted items:', items);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.deleted && this.days(item.updated, today) > this.settings.common.expirationDays) {
        logger.info('enqueue(item', [item.title, item.created, item.updated]);
        db.enqueue(item, 'remove');
      }
    }

    await db.dequeue();
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
