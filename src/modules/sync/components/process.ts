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

function updateIdentity(info: IdentityInfo, file: IFileInfo): IdentityInfo {
  return {
    ...info,

    fileId: file.id,
    encrypted: file.data.secret && info.encrypted,
    passphrase: file.data.secret && info.passphrase,
  };
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

export async function checkFileSecret(file: IFileInfo, encryptor?: CryptoService): Promise<boolean> {
  return await encryptor.verify(file.data.secret);
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

export async function ensureFile(identity: IdentityInfo, encryptor?: CryptoService): Promise<IFileInfo> {
  let file: IFileInfo =  memInfo.file || await lookUpFile(identity);

  if (file && !file.id) {
    file = await GoogleDrive.create(identity.token, file.data);
    file.isNew = true;

    await delay();
  }

  if (!identity.fileId && !file || !file.id) {
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

  if ((file.data?.secret && !encryptor) ||
    file.data?.secret && encryptor && !(await checkFileSecret(file, encryptor))) {
    const error = new TokenSecretDenied();

    await lock(error.message, file.data.items.map(i => i.i));
    throw error;
  }

  memInfo.file = null;

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
      logger.info(i, ' - already removed, continue ...');
      continue;
    }

    // mark deleted
    if (!info.cloud && info.db?.synced && !file.isNew && !info.db.deleted) {
      cloud.changed = true;
      db.enqueue({ ...info.db, deleted: 1, synced: null }, 'update');
      logger.info(i, ' - marked deleted local item: ', info.db.id, info.db.title);
      continue;
    }

    // update local
    if (info.cloud && (!info.db || info.db.updated < info.cloud.u)) {
      cloud.changed = true;
      cloud.items.push(info.cloud);

      db.enqueue(
        { ...(await lib.unzip(info.cloud, (decryptor || encryptor))), synced: modified },
        info.db ? 'update' : 'add'
      );

      await logger.info(i, ' - received new item: ', info.cloud.i, info.cloud.t);
      continue;
    }

    // remove from cloud
    if (info.db && info.cloud && (info.db.deleted || !info.db.description)) {
      cloud.changed = true;
      cloud.modified = modified;
      db.enqueue({ ...info.db, synced: null }, 'update');
      logger.info(i, ' - marked un-sync local item: ', info.db.id, info.db.title);
      continue;
    }

    // put updated on cloud
    if (info.db && !info.db.deleted && (!info.cloud || info.db.updated > info.cloud.u)) {
      cloud.changed = true;
      cloud.modified = modified;
      db.enqueue({ ...info.db, synced: modified }, 'update');
      cloud.items.push(await lib.zip(info.db, encryptor));
      await logger.info(i, ' - pushed item to cloud: ', info.db.id, info.db.title);
      continue;
    }

    // keep the rest
    if (!info.db.deleted) {
      db.enqueue({ ...info.db, synced: modified }, 'update');
      cloud.items.push(await lib.zip(info.db, encryptor));
    }
  }

  await db.dequeue();

  return cloud;
}

export async function sync(identity: IdentityInfo, encryptor?: CryptoService): Promise<IdentityInfo> {
  const file = await ensureFile(identity, encryptor);
  const { changed, ...cloud } = await syncItems(file, file.data.secret ? encryptor : null);
  const newIdentity = updateIdentity(identity, file);

  if (cloud.modified !== file.data.modified) {
    await logger.info(' - new version will be updated.');

    if (newIdentity.encrypted && file.data.secret && encryptor && !encryptor.transparent) {
      cloud.secret = await encryptor.generateSecret();
      await logger.info(' - generated new secret:', cloud.secret);
    }

    cloud.rules = cloud.rules ? await encrypt(await decrypt(cloud.rules)) : cloud.rules;
    await GoogleDrive.update(identity.token, newIdentity.fileId, cloud);
  }

  if (changed) {
    await updateCache();
  }

  return newIdentity;
}

export async function encode(
  identity: IdentityInfo, encryptor: CryptoService, decryptor: CryptoService
): Promise<boolean> {
  const file = await ensureFile(identity, decryptor);
  const { changed, ...cloud } = await syncItems(file, encryptor, decryptor);

  await logger.info('encode: - new version will be updated.');

  if (identity.encrypted && !encryptor.transparent) {
    cloud.secret = await encryptor.generateSecret();
    await logger.info('encode: - generated new secret:', cloud.secret);
  }

  if (!identity.fileId) {
    throw new IntegrityError('Cannot encode since no file ID is provided.');
  }

  cloud.rules = cloud.rules ? await encrypt(await decrypt(cloud.rules)) : cloud.rules;
  await GoogleDrive.update(identity.token, identity.fileId, cloud);

  if (changed) {
    await updateCache();
  }

  return true;
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
