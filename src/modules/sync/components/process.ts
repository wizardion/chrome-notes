import * as lib from './lib';
import { db } from 'modules/db';
import { delay, encrypt, decrypt } from 'core';
import * as drive from './drive';
import { storage, ISyncInfo } from 'core/services';
import { LoggerService } from 'modules/logger';
import { EncryptorService } from 'modules/encryption';
import {
  ISyncPair, ICloudInfo, TokenError, TokenSecretDenied, IProcessInfo, IntegrityError,
  IPasswordRule, IdentityInfo, IFileInfo, ISyncRequest
} from './interfaces';


const logger = new LoggerService('sync.ts', 'blue');

//#region testing
LoggerService.tracing = true;

//#endregion

export async function startProcess(): Promise<void> {
  const processId: number = new Date().getTime();

  return chrome.storage.session.set({ syncProcessing: processId });
}

export async function finishProcess(): Promise<void> {
  return chrome.storage.session.set({ syncProcessing: null });
}

export async function setProcessInfo(info: IdentityInfo): Promise<void> {
  return storage.local.sensitive('processInfo', { id: info.id, token: info.token });
}

export async function getIdentity(): Promise<IdentityInfo> {
  const identityInfo: IdentityInfo = <IdentityInfo> await storage.local.get('identityInfo');
  const processInfo: IProcessInfo = <IProcessInfo> await storage.local.get('processInfo');

  identityInfo.id = processInfo && processInfo.id;

  return identityInfo;
}

export async function validate(identityInfo: IdentityInfo): Promise<IdentityInfo> {
  const syncInfo: ISyncInfo = await storage.sync.get();

  if (!syncInfo.enabled || !syncInfo.token || !identityInfo.token) {
    throw new IntegrityError('Sync is not allowed at this time!');
  }

  return identityInfo;
}

export async function checkFileSecret(file: IFileInfo, cryptor?: EncryptorService): Promise<boolean> {
  return !file.data.secret || (cryptor && (await cryptor.verify(file.data.secret)));
}

export async function ensureFile(identity: IdentityInfo, cryptor?: EncryptorService): Promise<IFileInfo> {
  let isNew: boolean = false;

  if (!identity.id) {
    identity.id = await drive.find(identity.token);
    await delay();
  }

  if (!identity.id) {
    const rules: IPasswordRule = { count: 0, modified: 0 };
    const cloud: ICloudInfo = { modified: new Date().getTime(), items: [], rules: await encrypt(rules) };

    isNew = true;
    identity.id = await drive.create(identity.token, cloud);
    await delay();
  }

  const file: IFileInfo = await drive.get(identity.token, identity.id);

  if (!file.data.rules) {
    throw new IntegrityError('Error: Cloud data Integrity is corrupted.');
  }

  if (cryptor && !(await checkFileSecret(file, cryptor))) {
    throw new TokenSecretDenied();
  }

  file.isNew = isNew;

  return file;
}

async function syncItems(
  file: IFileInfo,
  oldCryptor?: EncryptorService,
  newCryptor?: EncryptorService
): Promise<ICloudInfo> {
  const cloud: ICloudInfo = { modified: file.data.modified, items: [], rules: file.data.rules };
  const pairInfo: ISyncPair[] = await lib.getDBPair(file.data.items);
  const modified: number = new Date().getTime();

  for (let i = 0; i < pairInfo.length; i++) {
    const info = pairInfo[i];

    // remove deleted
    if (info.db && info.db.deleted && !info.cloud) {
      continue;
    }

    // mark deleted
    if (info.db && !info.cloud && info.db.synced && !file.isNew && !info.db.deleted) {
      info.db.deleted = 1;
      await db.update(info.db);
      logger.info(i, ' - mark deleted local item: ', info.db.id);
      continue;
    }

    // update local
    if (info.cloud && (!info.db || info.db.updated < info.cloud.u)) {
      const decorator = info.db ? db.update : db.add;

      cloud.items.push(info.cloud);
      await decorator({ synced: modified, ...(await lib.unzip(info.cloud, oldCryptor)) });
      await logger.info(i, ' - received new item: ', info.cloud.i);
      continue;
    }

    // put updated on cloud
    if (info.db && !info.db.deleted && (!info.cloud || info.db.updated > info.cloud.u)) {
      cloud.modified = modified;
      await db.update({ synced: modified, ...info.db });
      cloud.items.push(await lib.zip(info.db, (newCryptor || oldCryptor)));
      await logger.info(i, ' - pushed new/updated item to cloud: ', info.db.id);
      continue;
    }

    // keep the rest
    if (!info.db.deleted) {
      await db.update({ synced: modified, ...info.db });
      cloud.items.push(await lib.zip(info.db, (newCryptor || oldCryptor)));
    }
  }

  return cloud;
}

export async function sync(identity: IdentityInfo, oldCryptor?: EncryptorService, newCryptor?: EncryptorService) {
  const file: IFileInfo = await ensureFile(identity, oldCryptor);
  const cloud: ICloudInfo = await syncItems(file, oldCryptor, newCryptor);

  if (cloud.modified !== file.data.modified || newCryptor) {
    const EncryptorService = newCryptor || oldCryptor;

    await logger.info(' - new version will be updated.');

    if (EncryptorService && !EncryptorService.transparent) {
      cloud.secret = await EncryptorService.generateSecret();
      await logger.info(' - generated new secret:', cloud.secret);
    }

    cloud.rules = cloud.rules ? await encrypt(await decrypt(cloud.rules)) : cloud.rules;
    await drive.update(identity.token, identity.id, cloud);
  }
}

export async function getProcess(level?: number): Promise<number> {
  const processId: number = (await chrome.storage.session.get('syncProcessing')).syncProcessing;

  if (processId) {
    logger.info(`process is busy...`);
    const hours = Math.abs(new Date().getTime() - processId) / 36e5;

    if (!level && hours > 2) {
      logger.error(`process is hanging for ${hours} hours, terminate.`);
      await finishProcess();

      return getProcess(level + 1);
    }
  }

  return processId;
}

export async function exec(name: string, request: ISyncRequest, lock: boolean = true): Promise<boolean> {
  const processId: number = await getProcess();
  let successful = false;

  if (!processId) {
    try {
      await startProcess();
      logger.info(`${name} process started...`);

      await request();
      successful = true;
    } catch (error) {
      await logger.error(error.message);

      if (lock && error instanceof TokenSecretDenied) {
        await lib.lock(error.message);
      }

      if (!(error instanceof TokenError)) {
        error.message = 'Unexpected error occurred during the sync process.';
      }

      throw error;
    } finally {
      await finishProcess();
      logger.info(`${name} process finished.`);
    }
  } else {
    throw Error('Sync process is busy');
  }

  return successful;
}
