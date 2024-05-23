import * as lib from './lib';
import { db } from 'modules/db';
import { delay, encrypt, decrypt } from 'core';
import { GoogleDrive } from './drive';
import { storage, ISyncInfo } from 'core/services';
import { LoggerService } from 'modules/logger';
import { CryptoService } from 'modules/encryption';
import {
  ISyncPair, ICloudInfo, TokenError, TokenSecretDenied, IProcessInfo, IntegrityError,
  IPasswordRule, IdentityInfo, IFileInfo, ISyncRequest
} from './models/sync.models';


const logger = new LoggerService('sync.ts', 'blue');

export async function setProcessInfo(info: IdentityInfo): Promise<void> {
  return storage.local.sensitive('processInfo', { id: info.fileId, token: info.token });
}

export async function getIdentity(): Promise<IdentityInfo | null> {
  const identityInfo = await storage.local.get<IdentityInfo>('identityInfo');
  const processInfo = await storage.local.get<IProcessInfo>('processInfo');

  if (identityInfo) {
    identityInfo.fileId = processInfo?.id;
  }

  return identityInfo || null;
}

export async function validate(identityInfo: IdentityInfo): Promise<IdentityInfo> {
  const syncInfo: ISyncInfo = await storage.sync.get();

  if (!identityInfo && syncInfo.enabled && syncInfo.token) {
    throw new IntegrityError('It looks like we have lost your file identity info.\nPlease remove it manually!');
  }

  if (identityInfo && (!syncInfo.enabled || (!syncInfo.token && !identityInfo.token))) {
    throw new IntegrityError('Sync is not allowed at this time!');
  }

  return identityInfo;
}

export async function checkFileSecret(file: IFileInfo, cryptor?: CryptoService): Promise<boolean> {
  return !file.data.secret || (cryptor && (await cryptor.verify(file.data.secret)));
}

export async function ensureFile(identity: IdentityInfo, cryptor?: CryptoService): Promise<IFileInfo> {
  let isNew: boolean = false;
  let file: IFileInfo;

  if (!identity.fileId) {
    file = await GoogleDrive.find(identity.token);
    await delay();
  }

  if (!identity.fileId && !file) {
    const rules: IPasswordRule = { count: 0, modified: 0 };
    const cloud: ICloudInfo = { modified: new Date().getTime(), items: [], rules: await encrypt(rules) };

    isNew = true;
    file = await GoogleDrive.create(identity.token, cloud);
    await delay();
  }

  if (!file && identity.fileId) {
    file = await GoogleDrive.get(identity.token, identity.fileId);
  }

  if (!file) {
    throw new TokenError('Cannot find data in cloud.');
  }

  if (!file.data?.rules) {
    throw new IntegrityError('Cloud data Integrity is corrupted.');
  }

  if (cryptor && !(await checkFileSecret(file, cryptor))) {
    throw new TokenSecretDenied();
  }

  file.isNew = isNew;

  return file;
}

async function updateCache() {
  const cache = await storage.cached.dump();

  if (cache.selected) {
    const item = await db.get(cache.selected.id);

    if (item) {
      await logger.info(' - updating cache:', item.id, item.title);
      await storage.cached.set('selected', item);
    } else {
      await storage.cached.remove(['selected']);
    }
  }
}

async function syncItems(
  file: IFileInfo,
  oldCryptor?: CryptoService,
  newCryptor?: CryptoService
): Promise<ICloudInfo> {
  const cloud: ICloudInfo = { modified: file.data.modified, items: [], rules: file.data.rules, changed: false };
  const pairInfo: ISyncPair[] = await lib.getDBPair(file.data.items);
  const modified: number = new Date().getTime();

  for (let i = 0; i < pairInfo.length; i++) {
    const info = pairInfo[i];

    // remove deleted
    if (info.db && (info.db.deleted || !info.db.description) && !info.cloud) {
      continue;
    }

    // mark deleted
    if (info.db && !info.cloud && info.db.synced && !file.isNew && !info.db.deleted) {
      cloud.changed = true;
      await db.update({ ...info.db, deleted: 1, synced: null });
      logger.info(i, ' - marked deleted local item: ', info.db.id, info.db.title);
      continue;
    }

    // update local
    if (info.cloud && (!info.db || info.db.updated < info.cloud.u)) {
      const decorator = info.db ? db.update : db.add;

      cloud.changed = true;
      cloud.items.push(info.cloud);
      await decorator({ ...(await lib.unzip(info.cloud, oldCryptor)), synced: modified });
      await logger.info(i, ' - received new item: ', info.cloud.i, info.cloud.t);
      continue;
    }

    // remove from cloud
    if (info.db && info.db.synced && info.cloud && (info.db.deleted || !info.db.description)) {
      cloud.changed = true;
      cloud.modified = modified;
      await db.update({ ...info.db, synced: null });
      logger.info(i, ' - marked un-sync local item: ', info.db.id, info.db.title);
      continue;
    }

    // put updated on cloud
    if (info.db && !info.db.deleted && (!info.cloud || info.db.updated > info.cloud.u)) {
      cloud.changed = true;
      cloud.modified = modified;
      await db.update({ ...info.db, synced: modified });
      cloud.items.push(await lib.zip(info.db, (newCryptor || oldCryptor)));
      await logger.info(i, ' - pushed item to cloud: ', info.db.id, info.db.title);
      continue;
    }

    // keep the rest
    if (!info.db.deleted) {
      await db.update({ ...info.db, synced: modified });
      cloud.items.push(await lib.zip(info.db, (newCryptor || oldCryptor)));
    }
  }

  return cloud;
}

export async function sync(info: IdentityInfo, first?: CryptoService, second?: CryptoService): Promise<IdentityInfo> {
  const file: IFileInfo = await ensureFile(info, first);
  const cloud: ICloudInfo = await syncItems(file, first, second);

  if (cloud.modified !== file.data.modified || second) {
    const CryptoService = second || first;

    await logger.info(' - new version will be updated.');

    if (CryptoService && !CryptoService.transparent) {
      cloud.secret = await CryptoService.generateSecret();
      await logger.info(' - generated new secret:', cloud.secret);
    }

    cloud.rules = cloud.rules ? await encrypt(await decrypt(cloud.rules)) : cloud.rules;
    await GoogleDrive.update(info.token, info.fileId, cloud);
  }

  if (cloud.changed) {
    await updateCache();
  }

  info.fileId = file.id;

  return info;
}

export async function exec<T>(request: ISyncRequest<T>, lock: boolean = true): Promise<T> {
  try {
    return await request();
  } catch (er) {
    const error = (typeof er === 'string') ? new Error(er) : er;

    await logger.error(error.message);

    if (lock && error instanceof TokenSecretDenied) {
      await lib.lock(error.message);
    }

    if (!(error instanceof TokenError)) {
      error.message = 'Unexpected error occurred during the sync process.';
    }

    throw error;
  }
}
