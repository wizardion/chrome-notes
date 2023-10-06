import { dump, enqueue, dequeue } from 'modules/db/idb';
import { Logger } from 'modules/logger/logger';
import { BaseWorker } from './base-worker';


const logger: Logger = new Logger('data-worker.ts', 'green');

export class DataWorker extends BaseWorker {
  static readonly expirationPeriod = 3;
  static readonly worker = 'data-worker';
  static readonly period = 60;

  private static days(updated: number, today: number) {
    const start = new Date(updated);
    const end = new Date(today);

    const first = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const second = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const millisecondsBetween = second.getTime() - first.getTime();
    const days = millisecondsBetween / millisecondsPerDay;

    return Math.floor(days);
  }

  static async process() {
    const items = await dump();
    const today = new Date().getTime();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.deleted && this.days(item.updated, today) > this.expirationPeriod) {
        logger.info('enqueue(item', [item.title, item.created, item.updated]);
        enqueue(item, 'remove');
      }
    }

    await dequeue();
  }
}
