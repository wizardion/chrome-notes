import { LocalStorageService } from 'core/services/local';
import { Cloud } from 'modules/sync/cloud';
import { IdentityInfo, TokenError } from 'modules/sync/components/models/sync.models';
import { BaseWorker } from './base-worker';
import { LoggerService } from 'modules/logger';
import { TerminateProcess } from './models/models';


const logger = new LoggerService('data-worker.ts', 'blue');

export class SyncWorker extends BaseWorker {
  static readonly worker = 'sync-worker';
  static readonly period = 0.5;

  protected readonly worker = SyncWorker.worker;

  async process() {
    await logger.info(`${SyncWorker.worker} process started...`);

    if (!(await this.busy())) {
      await this.start();

      try {
        await Cloud.sync();
      } catch (error) {
        if (error instanceof TokenError) {
          throw new TerminateProcess(this.worker, error.message);
        }
      }

      await this.finish();
    }

    await logger.info(`${SyncWorker.worker} process finished.`);
  }

  static async validate(identity?: IdentityInfo): Promise<boolean> {
    const identityInfo: IdentityInfo = identity || <IdentityInfo> await LocalStorageService.get('identityInfo');

    return !!((identityInfo && identityInfo.enabled) &&
      (identityInfo.token && (!identityInfo.encrypted || identityInfo.passphrase) && !identityInfo.locked));
  }
}
