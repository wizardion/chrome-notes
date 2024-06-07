import { LocalStorageService } from 'core/services/local';
import { Cloud } from 'modules/sync/cloud';
import { IdentityInfo, TokenError } from 'modules/sync/components/models/sync.models';
import { BaseWorker, workerLogger } from './base-worker';
import { TerminateProcess } from '../models/models';
import { SyncStorageService } from 'core/services/sync';
import { getApplicationId } from 'core/index';


export class SyncWorker extends BaseWorker {
  static readonly name = 'sync-worker';
  static readonly period = 6e+2;

  readonly name = SyncWorker.name;

  async process() {
    try {
      const identity = await Cloud.sync();

      if (!identity.fileId && !identity.token) {
        await SyncStorageService.set({
          token: null,
          fileId: null,
          enabled: false,
          encrypted: false,
          applicationId: await getApplicationId(),
        });
        await LocalStorageService.sensitive('identityInfo', identity);
        await SyncWorker.deregister('Cloud data has been removed.');
      }
    } catch (error) {
      if (error instanceof TokenError) {
        await this.resetIdentity();
        throw new TerminateProcess(this.name, error.message);
      }
    }
  }

  static async validate(identity?: IdentityInfo): Promise<boolean> {
    const identityInfo = identity || await LocalStorageService.get<IdentityInfo>('identityInfo');

    return !!((identityInfo && identityInfo.enabled) &&
      (identityInfo.token && identityInfo.fileId &&
        (!identityInfo.encrypted || identityInfo.passphrase) && !identityInfo.locked));
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

  private async resetIdentity(info?: IdentityInfo) {
    const identity = info || await LocalStorageService.get<IdentityInfo>('identityInfo');

    identity.fileId = null;
    identity.token = null;

    return LocalStorageService.sensitive('identityInfo', identity);
  }
}
