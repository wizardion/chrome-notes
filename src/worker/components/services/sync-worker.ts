import { LocalStorageService } from 'core/services/local';
import { Cloud } from 'modules/sync/cloud';
import { IdentityInfo, TokenError, TokenSecretDenied } from 'modules/sync/components/models/sync.models';
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
      const info = await LocalStorageService.get<IdentityInfo>('identityInfo');
      const identity = await Cloud.sync(info);

      if (!identity.fileId && !identity.token) {
        await SyncStorageService.set({
          token: null,
          fileId: null,
          enabled: false,
          encrypted: false,
          applicationId: await getApplicationId(),
        });

        await SyncWorker.deregister('Cloud data has been removed.');
      }

      if (this.isIdentityChanged(info, identity)) {
        await LocalStorageService.sensitive('identityInfo', identity);
      }
    } catch (error) {
      if (error instanceof TokenSecretDenied) {
        throw new TerminateProcess(this.name, error.message);
      }

      if (error instanceof TokenError) {
        await this.resetIdentity();
        throw new TerminateProcess(this.name, error.message);
      }
    }
  }

  static async validate(identity?: IdentityInfo): Promise<boolean> {
    const identityInfo = identity || await LocalStorageService.get<IdentityInfo>('identityInfo');

    const valid = !!((identityInfo && identityInfo.enabled) &&
      (identityInfo.token && identityInfo.fileId &&
        (!identityInfo.encrypted || identityInfo.passphrase) && !identityInfo.locked));

    return valid;
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

  static async lock(info?: IdentityInfo, reason?: string): Promise<void> {
    return Cloud.lock(info, reason);
  }

  private async resetIdentity(info?: IdentityInfo) {
    const identity = info || await LocalStorageService.get<IdentityInfo>('identityInfo');

    identity.fileId = null;
    identity.token = null;

    return LocalStorageService.sensitive('identityInfo', identity);
  }

  private isIdentityChanged(oldInfo?: IdentityInfo, newInfo?: IdentityInfo): boolean {
    return oldInfo.enabled !== newInfo.enabled || oldInfo.encrypted !== newInfo.encrypted
      || oldInfo.fileId !== newInfo.fileId || oldInfo.locked !== newInfo.locked
      || oldInfo.passphrase !== newInfo.passphrase;
  }
}
