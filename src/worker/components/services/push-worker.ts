import { BaseWorker } from './base-worker';
import { SyncWorker } from './sync-worker';
import { SyncStorageService } from 'core/services/sync';


export class PushWorker extends BaseWorker {
  static readonly name = 'pusher-worker';
  static readonly period = 2;

  readonly name = PushWorker.name;

  async process() {
    if (!(await this.busy())) {
      await this.start();

      if (SyncWorker.validate()) {
        const process = await chrome.alarms.get(SyncWorker.name);

        if (process?.name) {
          await this.finish();

          return SyncStorageService.registerTime();
        }
      }

      await this.finish();
    }
  }
}
