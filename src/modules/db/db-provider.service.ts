import * as db from './db.module';
import { IDBNote, IStoragePushInfo } from './models/db.models';
import { CachedStorageService } from 'core/services/cached';


export class DbProviderService {
  private static pushWorker = 'pusher-worker';
  private static syncWorker = 'sync-worker';
  private static registered: NodeJS.Timeout;
  private static syncEnabled: boolean;
  private static connected: boolean;

  public static get cache(): typeof CachedStorageService {
    return CachedStorageService;
  }

  public static async init() {
    const { getSettings } = await import('modules/settings');
    const settings = await getSettings({ sync: true, identity: true });
    const alarm = await chrome.alarms.get(this.syncWorker);

    this.syncEnabled = alarm && settings.sync.enabled && !!settings.sync.token && settings.identity.enabled
      && (
        !!settings.identity.token && settings.identity.fileId
        && (!settings.identity.encrypted || settings.identity.passphrase)
        && !settings.identity.locked
      );
  }

  public static async save(item: IDBNote): Promise<number> {
    if (item.id) {
      await db.update(item);
    } else {
      item.id = await db.add(item);
    }

    if (this.syncEnabled && !this.registered && item.push) {
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

    if (this.syncEnabled && !this.registered && queue.length > 0) {
      this.registerPush();
    }
  }

  public static async delete(item: IDBNote) {
    item.deleted = 1;
    await db.update(item);

    if (this.syncEnabled && !this.registered && item.description) {
      this.registerPush();
    }
  }

  private static async registerPush(delayInMinutes: number = 15) {
    const { pushInfo } = await chrome.storage.local.get('pushInfo') as IStoragePushInfo;

    if (!pushInfo) {
      const alarm = await chrome.alarms.get(this.pushWorker);

      if (alarm) {
        await chrome.alarms.clear(this.pushWorker);
      }

      if (!this.connected) {
        this.connect();
      }

      await chrome.storage.session.set({ pushInfo: new Date().getTime() });

      return chrome.alarms.create(this.pushWorker, { delayInMinutes: delayInMinutes });
    }

    clearInterval(this.registered);
    this.registered = setTimeout(async () => this.registered = null, delayInMinutes * 60);
  }

  private static connect() {
    try {
      const port = chrome.runtime.connect(null, { name: this.pushWorker });

      if (port?.name) {
        this.connected = true;
      }
    } catch (error) {
      console.log('error', error);
    }
  }
}
