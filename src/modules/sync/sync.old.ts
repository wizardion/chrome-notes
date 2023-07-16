// import * as idb from '../db/idb';
// import {ISyncNote, ISyncPair} from './interfaces';
// import {IDBNote} from '../db/interfaces';
// import {Encryptor} from '../encryption/encryptor';
// import * as lib from './lib';
// import {Logger} from '../logger/logger';


// const logger: Logger = new Logger('sync.ts', 'blue');
// var __cryptor: Encryptor = null;


// export function initApplication(): number {
//   return lib.initApplication();
// }

// export function isBusy(): Promise<boolean> {
//   return lib.isBusy();
// }

// export function wait(): Promise<void> {
//   return lib.wait();
// }

// export function start(internalKey?: string): Promise<void> {
//   return lib.startProcess(async (resolve, reject) => {
//     try {
//       // await logger.info('process started...');
//       let local = await chrome.storage.local.get(['syncEnabled', 'internalKey', 'syncLocked']);
//       let data = await chrome.storage.sync.get();

//       await logger.info('process sync:data', {'d': data});

//       if (local.syncEnabled &&  data.secretKey && (!internalKey && !local.internalKey)) {
//         let map: {[key: number]: ISyncPair} = await lib.getDBPair(data);

//         await lib.lockData(map);
//         return reject('No encryption key. Please review your encryption key on the options page.');
//       }

//       if (local.syncEnabled && (internalKey || local.internalKey)) {
//         let map: {[key: number]: ISyncPair} = await lib.getDBPair(data);
//         __cryptor = new Encryptor(internalKey || local.internalKey);
        
//         if (data.secretKey && !await __cryptor.verify(data.secretKey)) {
//           logger.warn('lock data');
//           await lib.lockData(map);
//           return reject('Can\'t decrypt data from cloud. Please review your encryption key on the options page.');
//         }

//         if (local.syncLocked) {
//           await lib.unlockData(map);
//         }

//         await sync(map, !data.secretKey);
//         await lib.updateCaches();
//         await chrome.storage.local.set({lastSync: new Date().getTime()});
//       }

//       __cryptor = null;
//       // await logger.info('process finished...', {'d': (await chrome.storage.sync.get() || {})});
//       resolve();
//     } catch (er) {
//       reject(er);
//     }
//   });
// }

// export async function resync(oldKey: string, newKey: string) {
//   await logger.info('=>=>=> start ReSync...');

//   await start(oldKey || newKey);
//   await logger.info('=>=>=> start-synced...');

//   if (oldKey) {
//     await logger.info('=>=>=> re-syncing...');
//     return lib.startProcess(async (resolve, reject) => {
//       try {
//         let local = await chrome.storage.local.get(['syncEnabled', 'internalKey', 'syncLocked']);
    
//         if (local.syncEnabled && local.internalKey && !local.syncLocked) {
//           __cryptor = new Encryptor(newKey);
//           let data = await chrome.storage.sync.get();
//           let map: {[key: number]: ISyncPair} = await lib.getDBPair(data);
      
//           await sync(map, true);
//           await lib.updateCaches();
//           await logger.info('=>=>=> re-sync is completed!');
//           resolve();
//         }
//       } catch (er) {
//         reject(er);
//       }
//     });
//   }
// }

// export async function onMessage(message: {[key: string]: any}) {
//   if (message.applicationId && message.applicationId !== await lib.default.applicationId()) {
//     await logger.info('::received message:', message);
//     return await processMessage(message.data);
//   }
// }
// //----------------------------------------------------------------------------------------------------------------------
// async function sync(map: {[key: number]: ISyncPair}, force?: boolean) {
//   await logger.info('sync-start: ....................................................................................');
//   var deleted: number[] = [];
//   var desync: number[] = [];
//   var changed: boolean = force;

//   if (!force) {
//     changed = await deriveMessages(map);
//   }

//   for (let i = 0, keys = Object.keys(map); i < keys.length; i++) {
//     const item = map[parseInt(keys[i])];

//     if (item.db && !item.cloud && item.db.deleted) {
//       await idb.remove(item.db.id);
//       await logger.info(i, ' - remove local note: ', item.db.id, 'remains: ', lib.default.rest());
//       continue;
//     }

//     if (item.db && item.cloud && item.db.deleted && item.db.updated > item.cloud.u) {
//       await idb.remove(item.db.id);
//       changed = await removeFromCloud(item.db, item.cloud.chunks);
//       deleted.push(item.db.id);
//       await logger.info(i, ' - remove note from Cloud: ', item.cloud.i, 'remains: ', lib.default.rest());
//       continue;
//     }

//     if (item.db && item.cloud && !item.db.sync && item.db.updated > item.cloud.u) {
//       changed = await removeFromCloud(item.db, item.cloud.chunks);
//       desync.push(item.db.id);
//       await logger.info(i, ' - desync note: ', item.db.id, 'remains: ', lib.default.rest());
//       continue;
//     }

//     if (item.cloud && (!item.db || item.db.updated < item.cloud.u)) {
//       changed = await saveToDB(item);
//       await logger.info(i, ' - receive note from Cloud: ', item.cloud.i, 'remains: ', lib.default.rest());
//       continue;
//     }

//     if (item.db && item.db.sync && (!item.cloud || item.db.updated > item.cloud.u || force)) {
//       changed = await removeFromCloud(item.db, item.cloud && item.cloud.chunks || 0);
//       changed = await saveToCloud(item.db);
//       await logger.info(i, ' - upload note to Cloud: ', item.db.id, 'remains: ', lib.default.rest());
//     }
//   }

//   if (changed) {
//     if (deleted.length || desync.length) {
//       await lib.delay();
//       await sendMessage({deleted: deleted, desync: desync});
//     }

//     await lib.delay();
//     await chrome.storage.sync.set({secretKey: await __cryptor.secretKey()});
//     await logger.info('send key', {secretKey: await __cryptor.secretKey()});
//     await chrome.storage.local.set({restItems: lib.default.rest(), lastSync: new Date().getTime()});
//     await logger.info('restItems', {restItems: lib.default.rest(), lastSync: new Date().getTime()});
//   }
  
//   await logger.info('sync-end:   ....................................................................................');
//   return lib.delay();
// }

// async function processSync(map: {[key: number]: ISyncPair}, force?: boolean) {
//   var deleted: number[] = [];
//   var desync: number[] = [];
//   var changed: boolean = force;

//   for (let i = 0, keys = Object.keys(map); i < keys.length; i++) {
//     const item = map[parseInt(keys[i])];

//     if (item.db && !item.cloud && item.db.deleted) {
//       await idb.remove(item.db.id);
//       await logger.info(i, ' - removed local note: ', item.cloud.i, 'remains: ', lib.default.rest());
//       continue;
//     }

//     if (item.db && item.cloud && item.db.deleted) {
//       await idb.remove(item.db.id);
//       changed = await removeFromCloud(item.db, item.cloud.chunks);
//       deleted.push(item.db.id);
//       await logger.info(i, ' - removed note: ', item.cloud.i, 'remains: ', lib.default.rest());
//       continue;
//     }

//     if (item.db && item.cloud && !item.db.sync) {
//       changed = await removeFromCloud(item.db, item.cloud.chunks);      
//       desync.push(item.db.id);
//       await logger.info(i, ' - desync note: ', item.db.id, 'remains: ', lib.default.rest());
//       continue;
//     }

//     if (item.cloud && (!item.db || item.db.updated < item.cloud.u)) {
//       changed = await saveToDB(item);
//       await logger.info(i, ' - received note from Cloud: ', item.cloud.i, 'remains: ', lib.default.rest());
//       continue;
//     }

//     if (item.db && item.db.sync && (!item.cloud || item.db.updated > item.cloud.u || force)) {
//       changed = await saveToCloud(item.db);
//       await logger.info(i, ' - uploaded note to Cloud: ', item.db.id, 'remains: ', lib.default.rest());
//     }
//   }

//   return [deleted, desync, changed];
// }

// async function sendMessage(data:{[key: string]: any}) {
//   let message = {
//     id: new Date().getTime(),
//     data: data,
//     applicationId: await lib.default.applicationId()
//   };
  
//   await chrome.storage.sync.set({message: message});
//   await logger.info('send message', message);
// }

// async function deriveMessages(map: {[key: number]: ISyncPair}): Promise<boolean> {
//   var result: boolean = false;
//   var messages = (await chrome.storage.local.get('messages') || {}).messages || [];

//   if (messages.length) {
//     for (let j = 0; j < messages.length; j++) {
//       const message = messages[j];
      
//       if (message.deleted || message.desync) {
//         for (let i = 0; i < (message.desync || []).length; i++) {
//           const id: number = message.desync[i];
          
//           if (map[id] && map[id].db) {
//             map[id].db.sync = false;
//             await idb.update(map[id].db);
//             logger.warn(`- derive message: desync DB note [message]`, map[id].db.id);
//           } else {
//             logger.warn('derive message: not found map[id].db: ', id);
//           }
//         }
  
//         for (let i = 0; i < (message.deleted || []).length; i++) {
//           const id: number = message.deleted[i];
          
//           if (map[id] && map[id].db) {
//             await idb.remove(map[id].db.id);
//             delete map[id].db;
//             logger.warn(`- derive message: remove DB note [message]`, map[id].db.id);
//           } else {
//             logger.warn('derive message: not found map[id].db: ', id);
//           }
//         }

//         result = true;
//       }
//     }
    
//     await chrome.storage.local.set({messages: []});
//   }

//   return result;
// }

// function saveToDB(item: ISyncPair): Promise<boolean> {
//   return new Promise<boolean>(async (resolve, reject) => {
//     try {
//       var [title, description]: string[] = item.cloud.d.split('|');
//       var note: IDBNote = {
//         id: item.cloud.i,
//         title: await __cryptor.decrypt(title),
//         description: await __cryptor.decrypt(description),
//         order: item.cloud.o,
//         cState: item.cloud.s,
//         updated: item.cloud.u,
//         created: item.cloud.c,
//         deleted: false,
//         sync: true,
//         preview: false,
//         inCloud: true
//       };
    
//       if (item.db) {
//         note.preview = item.db.preview;
//         await idb.update(note);
//       } else {
//         await idb.add(note);
//       }
//       resolve(true);
//     } catch (error) {
//       reject(error);
//     }
//   });
// }

// async function saveToCloud(item: IDBNote) {
//   const chunks:{[key: string]: ISyncNote} = await lib.zipNote(__cryptor, item);
//   const keys = Object.keys(chunks);

//   lib.chunk(item.id, keys.length);

//   if (lib.default.rest() <= 0) {
//     lib.errorLogger(new Error('Max notes quota exceeded!'));
//     return false;
//   }

//   var data: {[key: string]: ISyncNote} = {};
//   for (let j = 0; j < keys.length; j++) {
//     const key: string = keys[j];
    
//     // data[key] = chunks[key];

//     try {
//       await lib.delay();
//       await chrome.storage.sync.set({[key]: chunks[key]});
//       // return true;
//     } catch (error) {
//       logger.info(item.id, 'data-item', 'd.length:', chunks[key].d.length, 'max:', chrome.storage.sync.QUOTA_BYTES_PER_ITEM);
//       logger.info(item.id, 'json', JSON.stringify(chunks[key]), JSON.stringify(chunks[key]).length);
//       throw error;
//     }
//   }

//   await lib.delay();
  
//   // try {
//   //   await chrome.storage.sync.set(data);
//   //   return true;
//   // } catch (error) {
//   //   logger.info(item.id, 'data-item', data);
//   //   throw error;
//   // }
//   return true;
// }

// async function removeFromCloud(item: IDBNote, chunks: number) {
//   if (chunks > 0) {
//     for (let i = 0; i < chunks; i++) {
//       await lib.delay();
//       await chrome.storage.sync.remove(`item_${item.id}_${i}`);
//     }
  
//     lib.chunk(item.id);
//     return true;
//   }
// }

// // async function syncSettings(sync: {[key: string]: any}) {
// //   var local = await chrome.storage.local.get(['syncEnabled', 'devMode']);

// //   if (sync.settings && (sync.settings.syncEnabled !== local.syncEnabled || sync.settings.devMode !== local.devMode)) {
// //     await chrome.storage.local.set({syncEnabled: sync.settings.syncEnabled, devMode: sync.settings.devMode});
// //     await logger.info('derived settings', sync.settings);
// //   }
// // }
// //----------------------------------------------------------------------------------------------------------------------
// async function processMessage(message: {[key: string]: any}) {
//   await logger.info('::process-changes', message);

//   if(message.deleted || message.desync) {
//     await wait();
//     var messages = (await chrome.storage.local.get('messages') || {}).messages || [];
    
//     messages.push({deleted: message.deleted || [], desync: message.desync || []});
//     await chrome.storage.local.set({messages: messages});
//     await logger.info('::set-deleted-or-desync:', message);
//   }

//   if(message.erased && message.secretKey) {
//     await wait();
//     await logger.info('::set-erase-data:', message);
    
//     await chrome.storage.local.clear();
//     await chrome.storage.sync.clear();
//     await updateDBItems(<number[]>message.erased, [], 'processChanges:erase');
//     lib.updateCaches();
//   }
// }

// async function updateDBItems(deleted: number[], desync: number[], action: string) {
//   if (!deleted.length && !desync.length) {
//     return;
//   }

//   // TODO Do we need this?
//   var notes: IDBNote[] = await idb.load();
//   let deleteItems: IDBNote[] = notes.filter(n => deleted.indexOf(n.id) > -1);
//   let desyncItems: IDBNote[] = notes.filter(n => desync.indexOf(n.id) > -1 && n.sync);

//   for (let i = 0; i < deleteItems.length; i++) {
//     const note = deleteItems[i];

//     // idb.remove(note.id, lib.errorLogger);
//     note.sync = false;
//     await idb.update(note);
//     logger.warn(`- remove DB note [${action}]`, note.id);
//   }

//   for (let i = 0; i < desyncItems.length; i++) {
//     const note = desyncItems[i];
    
//     note.sync = false;
//     await idb.update(note);
//     logger.warn(`- desync DB note [${action}]`, note.id);
//   }
// }
