import * as core from 'core';
import { GoogleDrive } from './components/drive';
import { CryptoService } from 'core/services/encryption';
import { IdentityInfo, IPasswordRule, TokenError } from './components/models/sync.models';
import * as process from './components/process';


export class Cloud {
  static async authorize() {
    return GoogleDrive.authorize();
  }

  static async deauthorize(token: string) {
    return GoogleDrive.deauthorize(token);
  }

  static async removeCache(token: string) {
    return GoogleDrive.removeCachedAuthToken(token);
  }

  static async wait() {
    let busy: boolean = true;

    while (busy) {
      await core.delay();
      busy = !!(await chrome.storage.session.get('workerProcessing')).workerProcessing;
    }
  }

  static async sync(identity: IdentityInfo): Promise<IdentityInfo> {
    return process.exec<IdentityInfo>(async () => {
      const cryptor = identity.passphrase && new CryptoService(identity.passphrase);

      identity.token = await GoogleDrive.renewToken();
      await core.delay();

      return process.sync(identity, cryptor);
    });
  }

  static async encode(info: IdentityInfo, oldSecret: string): Promise<boolean> {
    return process.exec<boolean>(async () => {
      const identity = await process.validate(info);

      identity.token = await GoogleDrive.renewToken();
      await core.delay();

      return await process.encode(
        identity, new CryptoService(info.passphrase), new CryptoService(oldSecret)
      );
    });
  }

  static async verifyIdentity(info: IdentityInfo): Promise<IdentityInfo | null> {
    const identity = await process.validate(info);
    const configs = { minHours: 1, maxAttempts: 30, modified: new Date().getTime() };

    identity.token = await GoogleDrive.renewToken();

    return await process.exec<IdentityInfo | null>(async () => {
      const file = await process.lookUpFile(identity);

      if (file && !file.isNew) {
        const rule = <IPasswordRule> await core.decrypt(file.data.rules);
        const hours = Math.abs(configs.modified - rule.modified) / 36e5;

        if (hours > configs.minHours) {
          rule.count = 0;
        }

        if (rule.count < configs.maxAttempts) {
          const valid = file.data.secret
            ? await process.checkFileSecret(file, new CryptoService(identity.passphrase))
            : true;

          file.data.rules = await core.encrypt({
            ...rule, modified: configs.modified, count: valid ? 0 : rule.count + 1
          });

          await GoogleDrive.update(identity.token, file.id, file.data);
          await core.delay();

          if (!valid) {
            return null;
          }

          identity.fileId = file.id;
          process.setFile(file);
        } else {
          const plural = configs.minHours > 1 ? 's' : '';

          throw new TokenError(`Please wait for at least ${configs.minHours} hour${plural} before trying again.`);
        }
      }

      return identity;
    });
  }

  static async remove() {
    await this.wait();

    return process.exec(async () => {
      const identity = await process.getIdentity();
      let token: string;

      if (identity) {
        try {
          token = await GoogleDrive.renewToken();

          await GoogleDrive.remove(token, identity?.fileId);
          await this.deauthorize(token);

          delete identity.token;
          delete identity.fileId;

          await core.delay();
        } catch {
          return;
        }
      }
    });
  }

  static async unlock() {
    process.unlock();
  }

  static async lock(info?: IdentityInfo, reason?: string) {
    const identity = info || await process.getIdentity();
    const file = process.lookUpFile(identity);

    process.lock(reason, (await file).data.items.map(i => i.i));
  }
}
