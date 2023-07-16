import { Logger } from "modules/logger/logger";
import storage from "modules/storage/storage";
import { IdentityInfo } from "modules/sync/components/interfaces";

const logger: Logger = new Logger('alarm-worker.ts', 'green');


export class AlarmWorker {
  static worker: string = 'sync-worker';
  static period: number = 5;

  static async validate(identity?: IdentityInfo): Promise<boolean> {
    const identityInfo: IdentityInfo = identity || <IdentityInfo>await storage.local.get('identityInfo');

    return !!((identityInfo && identityInfo.enabled) &&
      (identityInfo.token && (!identityInfo.encrypted || identityInfo.passphrase) && !identityInfo.locked));
  }

  static async start() {
    const process: chrome.alarms.Alarm = await chrome.alarms.get(this.worker);

    if (process) {
      await chrome.alarms.clear(this.worker);
    }

    chrome.alarms.create(this.worker, { periodInMinutes: this.period });
    logger.warn(`started ${this.worker}`);
  }

  static async stop() {
    const process: chrome.alarms.Alarm = await chrome.alarms.get(this.worker);

    if (process) {
      await chrome.alarms.clear(this.worker);
      logger.warn(`terminated ${this.worker}`);
    }
  }
}
