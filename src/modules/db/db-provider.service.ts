import * as db from './db.module';
import { IDBNote } from './models/db.models';
import { CachedStorageService } from 'core/services/cached';


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

    console.log('item save...', [item.id]);

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
  }

  public static async remove(id: number) {
    await db.remove(id);
  }
}
