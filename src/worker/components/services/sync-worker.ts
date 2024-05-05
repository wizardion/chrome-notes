import { LocalStorageService } from 'core/services/local';
import { Cloud } from 'modules/sync/cloud';
import { IdentityInfo, TokenError } from 'modules/sync/components/models/sync.models';
import { BaseWorker, workerLogger } from './base-worker';
import { TerminateProcess } from '../models/models';
import { PushWorker } from './push-worker';


export class SyncWorker extends BaseWorker {
  static readonly name = 'sync-worker';
  static readonly period = 6e+2;

  readonly name = SyncWorker.name;

  async process() {
    if (!(await this.busy())) {
      await this.start();

      try {
        await Cloud.sync();
        await PushWorker.deregister();
      } catch (error) {
        if (error instanceof TokenError) {
          await this.finish();
          throw new TerminateProcess(this.name, error.message);
        }
      }

      await this.finish();
    }
  }

  static async validate(identity?: IdentityInfo): Promise<boolean> {
    const identityInfo: IdentityInfo = identity || <IdentityInfo> await LocalStorageService.get('identityInfo');

    return !!((identityInfo && identityInfo.enabled) &&
      (identityInfo.token && (!identityInfo.encrypted || identityInfo.passphrase) && !identityInfo.locked));
  }

  static async removeCache(token: string) {
    return Cloud.removeCache(token);
  }

  static async register(minutes?: number): Promise<void> {
    const period = this.period + Math.floor(Math.random() * (this.maxGap - this.minGap) + this.minGap);
    const process = await chrome.alarms.get(this.name);

    if (process) {
      await chrome.alarms.clear(this.name);
    }

    await chrome.alarms.create(this.name, { periodInMinutes: period, delayInMinutes: minutes });
    await workerLogger.warn(`registered '${this.name}' with period: ${period} and delay: ${minutes || 0}.`);
  }
}
