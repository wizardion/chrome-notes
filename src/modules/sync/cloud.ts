import * as core from 'core';
import { GoogleDrive } from './components/drive';
import { CryptoService } from 'modules/encryption';
import { IdentityInfo, IPasswordRule, TokenError } from './components/models/sync.models';
import * as process from './components/process';


export class Cloud {
  static async authorize() {
    return GoogleDrive.authorize();
  }

  static async deauthorize(token: string) {
    console.log('Cloud.deauthorize', [token]);

    return GoogleDrive.deauthorize(token);
  }

  static async wait() {
    let busy: boolean = true;

    while (busy) {
      await core.delay();
      busy = !!(await chrome.storage.session.get('syncProcessing')).syncProcessing;
    }
  }

  static async sync(info?: IdentityInfo): Promise<IdentityInfo> {
    console.log('Cloud.sync...', { info });

    return process.exec<IdentityInfo>(async () => {
      const identity = info || await process.validate(await process.getIdentity());

      identity.token = await GoogleDrive.renewToken();
      await process.sync(identity, identity.passphrase && new CryptoService(identity.passphrase));
      await process.setProcessInfo(identity);

      await core.delay();
      console.log('Cloud.sync.finished!');

      return identity;
    });
  }

  static async encrypt(oldSecret: string, newSecret: string): Promise<boolean> {
    return process.exec<boolean>(async () => {
      const identity = await process.validate(await process.getIdentity());

      identity.token = await GoogleDrive.renewToken();
      await process.sync(identity, new CryptoService(oldSecret), new CryptoService(newSecret));
      await process.setProcessInfo(identity);
      await core.delay();

      return true;
    }, false);
  }

  static async verifyIdentity(info: IdentityInfo): Promise<IdentityInfo> {
    const identity = await process.validate(info);
    const rules = { minHours: 1, maxAttempts: 3, modified: new Date().getTime(), valid: false };

    identity.token = await GoogleDrive.renewToken();

    return await process.exec<IdentityInfo>(async () => {
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
        identity.id = rules.valid ? file.id : null;
        file.data.rules = await core.encrypt(rule);

        await GoogleDrive.update(identity.token, file.id, file.data);
        await process.setProcessInfo(identity);
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

      console.log('Cloud.remove....identity', [identity]);

      try {
        token = await GoogleDrive.renewToken();
      } catch {
        console.log('Cloud.return!');

        return;
      }

      console.log('Cloud.remove.token', [token]);

      await GoogleDrive.remove(token, identity?.id);
      await this.deauthorize(token);

      delete identity.token;
      delete identity.id;

      await process.setProcessInfo(identity);
      await core.delay();
    });
  }
}
