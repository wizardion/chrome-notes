import * as db from './idb';
import { IDBNote } from './interfaces';
import storage from 'modules/storage/storage';


export class DbProvider {
  public static async save(item: IDBNote): Promise<number> {
    if (item.id) {
      await db.update(item);
    } else {
      item.id = await db.add(item);
    }

    // console.log('save.item', item);
    return item.id;
  }

  public static async bulkSave(queue: IDBNote[], items?: IDBNote[]) {
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      
      db.enqueue(item, 'update');
    }

    if (items) {
      await storage.cached.set('list', items);
    }

    await db.dequeue();
  }

  public static async remove(item: IDBNote, items?: IDBNote[]) {
    item.deleted = true;
    await db.update(item);

    if (items) {
      await storage.cached.set('list', items);
    }
  }

  public static get cache() {
    return storage.cached;
  }
}
