import * as db from './db.module';
import { IEventIntervals } from 'core/components';
import { IDBNote, IStoragePushInfo } from './models/db.models';
import { CachedStorageService } from 'core/services/cached';
import { LoggerService } from 'modules/logger';


const delayInMinutes = 1;
const INTERVALS: IEventIntervals = { delay: (delayInMinutes * 60) * 1000, intervals: { push: null } };
const logger = new LoggerService('db-provider.service.ts', 'green');

LoggerService.tracing = true;

export class DbProviderService {
  private static pushWorker = 'pusher-worker';
  private static registered: boolean;
  private static syncEnabled: boolean;
  private static checkSync: boolean;

  public static get cache(): typeof CachedStorageService {
    return CachedStorageService;
  }

  public static async init(force?: boolean) {
    this.syncEnabled = force || await this.isSyncEnabled();
    this.checkSync = !!force;

    console.log('INTERVALS', [INTERVALS.delay]);
  }

  public static async save(item: IDBNote): Promise<number> {
    if (item.id) {
      await db.update(item);
    } else {
      item.id = await db.add(item);
    }

    if (this.syncEnabled && !this.registered && item.push) {
      this.push();
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
      this.push();
    }
  }

  public static async delete(item: IDBNote) {
    item.deleted = 1;
    await db.update(item);

    if (this.syncEnabled && !this.registered && item.description) {
      this.push();
    }
  }

  private static push() {
    this.registerPush();

    clearInterval(INTERVALS.intervals.push);
    INTERVALS.intervals.reset = setTimeout(async () => {
      await logger.info('de-registered push-event!');
      this.registered = false;
    }, INTERVALS.delay);
  }

  private static async registerPush() {
    const { pushInfo } = await chrome.storage.local.get('pushInfo') as IStoragePushInfo;

    this.registered = true;

    if (!pushInfo) {
      const alarm = await chrome.alarms.get(this.pushWorker);

      if (!alarm && (this.checkSync && await this.isSyncEnabled())) {
        await chrome.storage.local.set({ pushInfo: new Date().getTime() });
        await logger.info('registered push-event!');

        return chrome.alarms.create(this.pushWorker, { delayInMinutes: delayInMinutes });
      }
    }
  }

  private static async isSyncEnabled(): Promise<boolean> {
    const { getSettings } = await import('modules/settings');
    const settings = await getSettings({ sync: true, identity: true });

    return settings.sync.enabled && !!settings.sync.token && settings.identity.enabled
      && (
        !!settings.identity.token && (!settings.identity.encrypted || settings.identity.passphrase)
        && !settings.identity.locked
      );
  }
}
