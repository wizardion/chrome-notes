import * as core from 'core';
import * as drive from './components/drive';
import { EncryptorService } from 'modules/encryption';
import { IdentityInfo, IPasswordRule, TokenError, IntegrityError } from './components/models/sync.models';
import * as process from './components/process';


export class Cloud {
  static async authorize() {
    return drive.authorize();
  }

  static async deauthorize(token: string) {
    return drive.deauthorize(token);
  }

  static async wait() {
    let busy: boolean = true;

    while (busy) {
      await core.delay();
      busy = !!(await chrome.storage.session.get('syncProcessing')).syncProcessing;
    }
  }

  static async sync(): Promise<boolean> {
    return process.exec(async () => {
      const identity = await process.validate(await process.getIdentity());

      identity.token = await drive.renewToken();
      await process.sync(identity, identity.passphrase && new EncryptorService(identity.passphrase));
      await process.setProcessInfo(identity);


      await core.delay();
    });
  }

  static async encrypt(oldSecret: string, newSecret: string): Promise<boolean> {
    return process.exec( async () => {
      const identity = await process.validate(await process.getIdentity());

      identity.token = await drive.renewToken();
      await process.sync(identity, new EncryptorService(oldSecret), new EncryptorService(newSecret));
      await process.setProcessInfo(identity);
      await core.delay();
    }, false);
  }

  static async verifyIdentity(identity: IdentityInfo): Promise<boolean> {
    const rules = { minHours: 1, maxAttempts: 3, modified: new Date().getTime(), valid: false };

    if (!identity.token) {
      throw new IntegrityError('Sync is not allowed at this time!');
    }

    identity.token = await drive.renewToken();
    await process.exec(async () => {
      const file = await process.ensureFile(identity);
      const rule = <IPasswordRule> await core.decrypt(file.data.rules);
      const hours = Math.abs(rules.modified - rule.modified) / 36e5;

      if (hours > rules.minHours) {
        rule.count = 0;
      }

      if (rule.count < rules.maxAttempts) {
        rules.valid = await process.checkFileSecret(
          file, identity.passphrase && new EncryptorService(identity.passphrase)
        );

        rule.modified = rules.modified;
        rule.count = !rules.valid ? rule.count + 1 : rule.count;
        file.data.rules = await core.encrypt(rule);

        await drive.update(identity.token, identity.id, file.data);
        await process.setProcessInfo(identity);
        await core.delay();
      } else {
        const plural = rules.minHours > 1 ? 's' : '';

        throw new TokenError(`Please wait for at least ${rules.minHours} hour${plural} before trying again.`);
      }
    }, false);

    return rules.valid;
  }

  static async remove() {
    await this.wait();

    return process.exec(async () => {
      const identity = await process.getIdentity();
      let token: string;

      try {
        token = await drive.renewToken();
      } catch {
        return;
      }

      await drive.remove(token, identity?.id);
      await this.deauthorize(identity.token);

      delete identity.token;
      delete identity.id;

      await process.setProcessInfo(identity);
      await core.delay();
    });
  }
}
