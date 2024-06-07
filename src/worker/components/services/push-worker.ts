import { getApplicationId } from 'core';
import { IPushInfo, ISyncPushInfo } from '../models/models';
import { BaseWorker, workerLogger } from './base-worker';
import { SyncWorker } from './sync-worker';


export class PushWorker extends BaseWorker {
  static readonly infoKey = 'pushInfo';
  static readonly name = 'pusher-worker';
  static readonly period = 1;

  readonly name = PushWorker.name;

  async process() {
    if (await SyncWorker.validate()) {
      const process = await chrome.alarms.get(SyncWorker.name);

      if (process?.name) {
        const { pushInfo } = await chrome.storage.session.get(PushWorker.infoKey) as IPushInfo;
        const worker = new SyncWorker(this.settings);

        await worker.process();
        await chrome.storage.session.remove(PushWorker.infoKey);

        if (pushInfo > 1) {
          await chrome.storage.sync.set({
            pushInfo: {
              id: await getApplicationId(),
              time: new Date().getTime()
            } as ISyncPushInfo
          });
        }
      } else {
        await workerLogger.info(`${SyncWorker.name} is not registered.`);
      }
    }
  }

  async busy(): Promise<boolean> {
    const result = await super.busy();

    if (result && this.busyWorker && ![this.name, SyncWorker.name].includes(this.busyWorker)) {
      await workerLogger.info(`The process is taken by '${this.busyWorker}'. Re-register to sync...`);
      await PushWorker.register();
    }

    return result;
  }

  static async register(minutes: number = 2): Promise<void> {
    const alarm = await chrome.alarms.get(PushWorker.name);

    if (!alarm) {
      return chrome.alarms.create(PushWorker.name, { delayInMinutes: minutes });
    }
  }
}
