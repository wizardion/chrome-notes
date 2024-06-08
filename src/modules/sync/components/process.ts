import * as lib from './lib';
import { db } from 'modules/db';
import { delay, encrypt, decrypt } from 'core';
import { GoogleDrive } from './drive';
import { storage, ISyncInfo } from 'core/services';
import { LoggerService } from 'modules/logger';
import { CryptoService } from 'core/services/encryption';
import {
  ISyncPair, ICloudInfo, TokenError, TokenSecretDenied, IntegrityError,
  IPasswordRule, IdentityInfo, IFileInfo, ISyncRequest,
  IMemInfo
} from './models/sync.models';


const logger = new LoggerService('sync.ts', 'blue');
const memInfo: IMemInfo = { file: null };

export function setFile(file: IFileInfo) {
  memInfo.file = file;
}

export async function getIdentity(): Promise<IdentityInfo | null> {
  return storage.local.get<IdentityInfo>('identityInfo');
}

async function updateCache() {
  const cache = await storage.cached.dump();

  if (cache.selected) {
    const item = await db.get(cache.selected.id);

    if (item && !item.deleted && !item.locked) {
      await logger.info(' - updating cache:', item.id, item.title);
      await storage.cached.set('selected', item);
    } else {
      await logger.info(' - removing cache:', item?.id, item?.title);
      await storage.cached.remove(['selected']);
    }
  }
}

export async function unlock(): Promise<void> {
  return lib.unlock();
}

export async function lock(reason: string, ids: number[]): Promise<void> {
  await lib.lock(reason, ids);

  return updateCache();
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
  return await cryptor.verify(file.data.secret);
}

export async function lookUpFile(identity: IdentityInfo): Promise<IFileInfo> {
  let file: IFileInfo;

  if (!identity.fileId) {
    file = await GoogleDrive.find(identity.token);
    await delay();
  }

  if (!file && identity.fileId) {
    file = await GoogleDrive.get(identity.token, identity.fileId);
  }

  if (!identity.fileId && !file) {
    const rules: IPasswordRule = { count: 0, modified: 0 };
    const cloud: ICloudInfo = { modified: new Date().getTime(), items: [], rules: await encrypt(rules) };

    file = await GoogleDrive.create(identity.token, cloud);
    file.isNew = true;

    return {
      id: null,
      modifiedTime: null,
      trashed: false,
      isNew: true,
      data: cloud
    };
  }

  return file;
}

export async function ensureFile(identity: IdentityInfo, cryptor?: CryptoService): Promise<IFileInfo> {
  let file: IFileInfo = await lookUpFile(identity);

  if (!identity.fileId && !file || file.isNew) {
    const rules: IPasswordRule = { count: 0, modified: 0 };
    const cloud: ICloudInfo = { modified: new Date().getTime(), items: [], rules: await encrypt(rules) };

    file = await GoogleDrive.create(identity.token, cloud);
    file.isNew = true;

    await delay();
  }

  if (!file) {
    throw new IntegrityError('Cannot find data in the cloud.');
  }

  if (!file.data?.rules) {
    throw new IntegrityError('Cloud data Integrity is corrupted.');
  }

  if ((file.data?.secret && !cryptor) || file.data?.secret && cryptor && !(await checkFileSecret(file, cryptor))) {
    const error = new TokenSecretDenied();

    await lock(error.message, file.data.items.map(i => i.i));
    throw error;
  }

  return file;
}

async function syncItems(file: IFileInfo, encryptor?: CryptoService, decryptor?: CryptoService): Promise<ICloudInfo> {
  const cloud: ICloudInfo = { modified: file.data.modified, items: [], rules: file.data.rules, changed: false };
  const pairInfo: ISyncPair[] = await lib.getDBPair(file.data.items);
  const modified: number = new Date().getTime();

  for (let i = 0; i < pairInfo.length; i++) {
    const info = pairInfo[i];

    // remove deleted
    if (info.db && (info.db.deleted || !info.db.description) && !info.cloud) {
      logger.info(i, ' - continue ...');
      continue;
    }

    // mark deleted
    if (!info.cloud && info.db?.synced && !file.isNew && !info.db.deleted) {
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
      await decorator({ ...(await lib.unzip(info.cloud, (decryptor || encryptor))), synced: modified });
      await logger.info(i, ' - received new item: ', info.cloud.i, info.cloud.t);
      continue;
    }

    // remove from cloud
    if (info.db && info.cloud && (info.db.deleted || !info.db.description)) {
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
      cloud.items.push(await lib.zip(info.db, encryptor));
      await logger.info(i, ' - pushed item to cloud: ', info.db.id, info.db.title);
      continue;
    }

    // keep the rest
    if (!info.db.deleted) {
      await db.update({ ...info.db, synced: modified });
      cloud.items.push(await lib.zip(info.db, encryptor));
    }
  }

  return cloud;
}

export async function sync(identity: IdentityInfo, encryptor?: CryptoService): Promise<IdentityInfo> {
  const file = memInfo.file || await ensureFile(identity, encryptor);
  const { changed, ...cloud } = await syncItems(file, encryptor);

  if (cloud.modified !== file.data.modified || !file.data.secret && encryptor && !encryptor.transparent) {
    await logger.info(' - new version will be updated.');

    cloud.secret = encryptor ? await encryptor.generateSecret() : null;
    await logger.info(' - generated new secret:', cloud.secret);

    cloud.rules = cloud.rules ? await encrypt(await decrypt(cloud.rules)) : cloud.rules;
    await GoogleDrive.update(identity.token, identity.fileId, cloud);
  }

  if (changed) {
    await updateCache();
  }

  memInfo.file = null;

  return { ...identity, fileId: file.id };
}

export async function reEncrypt(identity: IdentityInfo, encryptor: CryptoService, decryptor: CryptoService) {
  const file = await ensureFile(identity, decryptor);
  const { changed, ...cloud } = await syncItems(file, encryptor, decryptor);

  await logger.info(' - new version will be updated.');

  cloud.secret = await encryptor.generateSecret();
  await logger.info(' - generated new secret:', cloud.secret);

  cloud.rules = cloud.rules ? await encrypt(await decrypt(cloud.rules)) : cloud.rules;
  await GoogleDrive.update(identity.token, identity.fileId, cloud);

  return changed;
}

export async function exec<T>(request: ISyncRequest<T>): Promise<T> {
  try {
    return await request();
  } catch (er) {
    const error = (typeof er === 'string') ? new Error(er) : er;

    await logger.error(error.message);

    if (!(error instanceof TokenError)) {
      error.message = 'Unexpected error occurred during the sync process.';
    }

    throw error;
  }
}
