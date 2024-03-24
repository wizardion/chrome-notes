// import * as lib from './lib';
// import * as idb from '../../db/idb';
// import * as core from 'modules/core';
// import * as drive from './drive';
// import storage from 'modules/storage/storage';
// import { Logger } from 'modules/logger/logger';
// import { Encryptor } from 'modules/encryption/encryptor';
// import { ISyncPair, ICloudInfo, TokenError, TokenSecretDenied, IdentityProcessInfo, IntegrityError } from './interfaces';
// import { IdentityInfo, ISyncInfo, IFileInfo, ISyncRequest } from './interfaces';

// const logger: Logger = new Logger('sync.ts', 'blue');

// //#region testing
// Logger.tracing = true;
// //#endregion

// export async function exec(name: string, request: ISyncRequest, level?: number) {
//   const processId: number = (await chrome.storage.session.get('syncProcessing')).syncProcessing;

//   if (!processId) {
//     return process(name, request);
//   } else {
//     logger.info(`${name} process is busy...`);
//     const hours = Math.abs(new Date().getTime() - processId) / 36e5;

//     if (!level && hours > 2) {
//       logger.error(`process is hanging for ${hours} hours, terminate.`);
//       await chrome.storage.session.set({ syncProcessing: null });
//       exec(name, request, level + 1);
//     }
//   }
// }

// export async function process(name: string, request: ISyncRequest) {
//   logger.info(`${name} process started...`);

//   try {
//     const syncInfo: ISyncInfo = await storage.sync.get();
//     const identityInfo: IdentityInfo = <IdentityInfo>await storage.local.get('identityInfo');
//     const processInfo: IdentityProcessInfo = <IdentityProcessInfo>await storage.local.get('identityProcessInfo');

//     if (!syncInfo.enabled || !syncInfo.authenticated || !identityInfo.token) {
//       throw new IntegrityError('Sync is not allowed at this time!');
//     }

//     identityInfo.id = processInfo && processInfo.id;
//     identityInfo.token = await drive.renewToken();

//     await request(identityInfo);
//     await storage.local.sensitive('identityProcessInfo', { id: identityInfo.id, token: identityInfo.token });
//   } catch (error) {
//     await logger.error(error.message);

//     if (error instanceof TokenSecretDenied) {
//       await lib.lock(error.message);
//     }

//     if (!(error instanceof TokenError)) {
//       error.message = 'Unexpected error occurred during the sync process.';
//     }

//     throw error;
//   } finally {
//     await chrome.storage.session.set({ syncProcessing: null });
//     logger.info(`${name} process finished.`);
//   }
// }

// export async function checkFile(file: IFileInfo, cryptor?: Encryptor): Promise<boolean> {
//   return !file.data.secret || (cryptor && (await cryptor.verify(file.data.secret)));
// }

// export async function ensureFile(identity: IdentityInfo, cloud: ICloudInfo, cryptor?: Encryptor): Promise<IFileInfo> {
//   let isNew: boolean = false;

//   if (!identity.id) {
//     identity.id = await drive.find(identity.token);
//     await core.delay();
//   }

//   if (!identity.id) {
//     identity.id = await drive.create(identity.token, cloud);
//     isNew = true;
//     await core.delay();
//   }

//   const file: IFileInfo = await drive.get(identity.token, identity.id);

//   if (!(await checkFile(file, cryptor))) {
//     throw new TokenSecretDenied();
//   }

//   file.isNew = isNew;
//   return file;
// }

// export async function syncItems(identity: IdentityInfo, cryptor?: Encryptor, decipher?: Encryptor) {
//   const cloud: ICloudInfo = { id: null, modified: new Date().getTime(), items: [] };
//   const file: IFileInfo = await ensureFile(identity, cloud, cryptor);
//   const pairInfo: ISyncPair[] = await lib.getDBPair(file.data.items);

//   if ((decipher || cryptor) && !(decipher || cryptor).transparent) {
//     cloud.secret = await (decipher || cryptor).generateSecret();
//   }

//   for (let i = 0; i < pairInfo.length; i++) {
//     const info = pairInfo[i];

//     if (info.db && info.db.deleted && !info.cloud) {
//       await idb.remove(info.db.id);
//       await logger.info(i, ' - removed deleted item: ', info.db.id);
//       continue;
//     }

//     if (
//       info.db &&
//       !info.db.deleted &&
//       !file.isNew &&
//       !info.cloud &&
//       info.db.synced &&
//       info.db.synced < file.data.modified
//     ) {
//       info.db.deleted = true;
//       await idb.update(info.db);
//       logger.info(i, ' - mark deleted local item: ', info.db.id);
//       continue;
//     }

//     if (info.cloud && (!info.db || info.db.updated < info.cloud.u)) {
//       let decorator = info.db ? idb.add : idb.update;

//       cloud.items.push(info.cloud);
//       await decorator({ synced: cloud.modified, ...(await lib.unzip(info.cloud, cryptor)) });
//       await logger.info(i, ' - receive new item: ', info.cloud.i);
//       continue;
//     }

//     if (!info.db.deleted) {
//       await idb.update({ synced: cloud.modified, ...info.db });
//       cloud.items.push(await lib.zip(info.db, decipher || cryptor));
//     }
//   }

//   await drive.update(identity.token, identity.id, cloud);
// }
