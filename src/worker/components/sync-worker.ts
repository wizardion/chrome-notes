import { LoggerService } from 'modules/logger';
import { LocalStorageService } from 'core/services/local';
import { Cloud } from 'modules/sync/cloud';
import { IdentityInfo } from 'modules/sync/components/interfaces';
import { BaseWorker } from './base-worker';


const logger = new LoggerService('alarm-worker.ts', 'green');

export class SyncWorker extends BaseWorker {
  static readonly worker = 'sync-worker';
  static readonly period = 5;

  async process() {
    if (!(await Cloud.busy())) {
      await Cloud.sync();
    } else {
      await logger.info(`${SyncWorker.worker} is busy`);
    }
  }

  static async validate(identity?: IdentityInfo): Promise<boolean> {
    const identityInfo: IdentityInfo = identity || <IdentityInfo> await LocalStorageService.get('identityInfo');

    return !!((identityInfo && identityInfo.enabled) &&
      (identityInfo.token && (!identityInfo.encrypted || identityInfo.passphrase) && !identityInfo.locked));
  }
}
