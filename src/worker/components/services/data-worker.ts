import { db } from 'modules/db';
import { LoggerService } from 'modules/logger';
import { BaseWorker, workerLogger } from './base-worker';


export class DataWorker extends BaseWorker {
  static readonly name = 'data-worker';
  static readonly period = 8e+2;

  readonly name = DataWorker.name;

  async process() {
    const items = await db.deleted();
    const today = new Date().getTime();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (item.deleted && !item.synced && (!item.description || this.isOutdated(item.updated, today))) {
        workerLogger.info('remove.item', item.title, item.created, item.updated);
        db.enqueue(item, 'remove');
      }
    }

    await db.dequeue();
    const logs = await LoggerService.getAll();

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      if (this.isOutdated(log.time, today)) {
        await LoggerService.delete(log.id);
      }
    }
  }

  private isOutdated(updated: number, today: number): boolean {
    const start = new Date(updated);
    const end = new Date(today);

    const first = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const second = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const millisecondsBetween = second.getTime() - first.getTime();
    const days = Math.floor(millisecondsBetween / millisecondsPerDay);
    const expirationDays = this.settings.common.expirationDays;

    return expirationDays === 0 ? days >= expirationDays : days > expirationDays;
  }
}
