import { Logger } from 'modules/logger/logger';
import storage from 'modules/storage/storage';
import { Cloud } from 'modules/sync/cloud';
import { IdentityInfo } from 'modules/sync/components/interfaces';
import { BaseWorker } from './base-worker';


const logger: Logger = new Logger('alarm-worker.ts', 'green');

export class SyncWorker extends BaseWorker {
  static readonly worker = 'sync-worker';
  static readonly period = 5;

  static async validate(identity?: IdentityInfo): Promise<boolean> {
    const identityInfo: IdentityInfo = identity || <IdentityInfo> await storage.local.get('identityInfo');

    return !!((identityInfo && identityInfo.enabled) &&
      (identityInfo.token && (!identityInfo.encrypted || identityInfo.passphrase) && !identityInfo.locked));
  }

  static async process() {
    if (!(await Cloud.busy())) {
      await Cloud.sync();
    } else {
      await logger.info(`${this.worker} is busy`);
    }
  }
}
