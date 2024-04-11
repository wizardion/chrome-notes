import { LocalStorageService } from 'core/services/local';
import { Cloud } from 'modules/sync/cloud';
import { IdentityInfo, TokenError } from 'modules/sync/components/models/sync.models';
import { BaseWorker } from './base-worker';
import { TerminateProcess } from './models/models';


export class SyncWorker extends BaseWorker {
  static readonly name = 'sync-worker';
  static readonly period = 15; // 120

  readonly name = SyncWorker.name;

  async process() {
    if (!(await this.busy())) {
      await this.start();

      try {
        await Cloud.sync();
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
}
