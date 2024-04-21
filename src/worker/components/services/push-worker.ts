import { getApplicationId } from 'core';
import { IPushInfo, ISyncPushInfo } from '../models/models';
import { BaseWorker, workerLogger } from './base-worker';
import { SyncWorker } from './sync-worker';


export class PushWorker extends BaseWorker {
  static readonly name = 'pusher-worker';
  static readonly period = 1;

  readonly name = PushWorker.name;

  private infoKey = 'pushInfo';

  async process() {
    await workerLogger.info(`${PushWorker.name} - started...`);

    if (!(await this.busy()) && await SyncWorker.validate()) {
      const process = await chrome.alarms.get(SyncWorker.name);

      if (process?.name) {
        const { pushInfo } = await chrome.storage.local.get(this.infoKey) as IPushInfo;
        const worker = new SyncWorker(this.settings);

        await worker.process();
        await chrome.storage.local.remove(this.infoKey);

        if (pushInfo > 1) {
          await workerLogger.info('register to sync.');

          await chrome.storage.sync.set({
            pushInfo: {
              time: new Date().getTime(), applicationId: await getApplicationId()
            } as ISyncPushInfo
          });
        }
      } else {
        await workerLogger.info(`${SyncWorker.name} is not registered.`);
      }
    }

    await workerLogger.info(`${PushWorker.name} - finished.`);
  }

  static async register(): Promise<void> {
    throw new Error('PushWorker should not be part of the scheduled services.');
  }

  // private async registerSync() {
  //   const date = new Date();

  //   await chrome.storage.sync.set({
  //     pushChanged: <ISyncPushInfo> {
  //       time: date.getTime(), applicationId: await getApplicationId()
  //     }
  //   });
  // }
}
