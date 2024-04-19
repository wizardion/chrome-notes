// import { IEventIntervals } from 'core/components';
import * as db from './db.module';
import { IDBNote } from './models/db.models';
import { CachedStorageService } from 'core/services/cached';


// const INTERVALS: IEventIntervals = { delay: 2000, intervals: { changed: null } };

export class DbProviderService {
  public static get cache(): typeof CachedStorageService {
    return CachedStorageService;
  }

  public static async save(item: IDBNote): Promise<number> {
    if (item.id) {
      await db.update(item);
    } else {
      item.id = await db.add(item);
    }

    if (item.push) {
      this.registerPush();
    }

    return item.id;
  }

  public static async bulkSave(queue: IDBNote[]) {
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];

      db.enqueue(item, 'update');
    }

    await db.dequeue();
  }

  public static async delete(item: IDBNote) {
    item.deleted = 1;
    await db.update(item);

    if (item.description) {
      this.registerPush();
    }
  }

  private static registerPush() {
    // clearInterval(INTERVALS.intervals.changed);
    // INTERVALS.intervals.changed = setTimeout(async () => CachedStorageService.registerPush(), INTERVALS.delay);
  }
}
