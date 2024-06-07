import * as core from 'core';
import { GoogleDrive } from './components/drive';
import { CryptoService } from 'core/services/encryption';
import { IdentityInfo, IFileInfo, IPasswordRule, TokenError } from './components/models/sync.models';
import * as process from './components/process';


export class Cloud {
  public static file?: IFileInfo;

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

  static async sync(info?: IdentityInfo): Promise<IdentityInfo> {
    return process.exec<IdentityInfo>(async () => {
      const identity = info || await process.validate(await process.getIdentity());
      const cryptor = identity.passphrase && new CryptoService(identity.passphrase);

      identity.token = await GoogleDrive.renewToken();

      const newIdentity = await process.sync(identity, cryptor, null, this.file);

      await core.delay();
      this.file = null;

      return newIdentity;
    });
  }

  static async encrypt(oldSecret: string, newSecret: string): Promise<boolean> {
    return process.exec<boolean>(async () => {
      const identity = await process.validate(await process.getIdentity());

      identity.token = await GoogleDrive.renewToken();
      await process.sync(identity, new CryptoService(oldSecret), new CryptoService(newSecret));
      await core.delay();

      return true;
    }, false);
  }

  static async verifyIdentity(info: IdentityInfo): Promise<IdentityInfo | null> {
    const identity = await process.validate(info);
    const rules = { minHours: 1, maxAttempts: 3, modified: new Date().getTime(), valid: false };

    identity.token = await GoogleDrive.renewToken();

    return await process.exec<IdentityInfo | null>(async () => {
      const file = await process.ensureFile(identity);
      const rule = <IPasswordRule> await core.decrypt(file.data.rules);
      const hours = Math.abs(rules.modified - rule.modified) / 36e5;

      if (hours > rules.minHours) {
        rule.count = 0;
      }

      if (rule.count < rules.maxAttempts) {
        rules.valid = await process.checkFileSecret(
          file, identity.passphrase && new CryptoService(identity.passphrase)
        );

        rule.modified = rules.modified;
        rule.count = !rules.valid ? rule.count + 1 : rule.count;
        identity.fileId = rules.valid ? file.id : null;
        file.data.rules = await core.encrypt(rule);

        this.file = rules.valid ? file : null;
        await GoogleDrive.update(identity.token, file.id, file.data);
        await core.delay();

        return rules.valid ? identity : null;
      } else {
        const plural = rules.minHours > 1 ? 's' : '';

        throw new TokenError(`Please wait for at least ${rules.minHours} hour${plural} before trying again.`);
      }
    }, false);
  }

  static async remove() {
    await this.wait();

    return process.exec(async () => {
      const identity = await process.getIdentity();
      let token: string;

      try {
        token = await GoogleDrive.renewToken();
      } catch {
        return;
      }

      await GoogleDrive.remove(token, identity?.fileId);
      await this.deauthorize(token);

      delete identity.token;
      delete identity.fileId;

      await core.delay();
    });
  }
}
