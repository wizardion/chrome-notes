import idb from '../db/idb';
import {ISyncNote, ISyncPair} from './interfaces';
import {IDBNote} from '../db/interfaces';
import {Encryptor} from '../encryption/encryptor';
import * as lib from './lib';


var rootLogs: any = null;
async function log(...args: any[]) {
  let local = await chrome.storage.local.get(['logs']);

  if (!rootLogs) {
    rootLogs = local;
  }

  if (!local.logs) {
    local.logs = [];
  }

  local.logs.push(args);
  await chrome.storage.local.set({logs: local.logs});
}

var __cryptor: Encryptor = null;
const colors = {
  RED: '\x1b[31m%s\x1b[0m',
  GREEN: '\x1b[32m%s\x1b[0m',
  BLUE: '\x1b[34m%s\x1b[0m',
};


export function initApp(): number {
  var appId: number = new Date().getTime();

  chrome.storage.local.set({appId: appId});
  chrome.storage.local.remove('syncProcessing');
  lib.updateCaches();

  return appId;
}

export function isBusy(): Promise<boolean> {
  return new Promise<boolean>(async (resolve, reject) => {
    var local = await chrome.storage.local.get(['syncProcessing']);

    resolve(local.syncProcessing);
  });
}

export function wait(): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    var busy: boolean = await isBusy();

    while(busy) {
      await lib.delay(1000);
      busy = await isBusy();
    }

    resolve();
  });
}

export function start(internalKey?: string): Promise<void> {
  return lib.startProcess(async (resolve, reject) => {
    try {
      let local = await chrome.storage.local.get(['syncEnabled', 'internalKey', 'syncLocked', 'appId']);
      let data = await chrome.storage.sync.get();

      if (local.syncEnabled && (internalKey || local.internalKey)) {
        let map: {[key: number]: ISyncPair} = await lib.getDBPair(data);
        __cryptor = new Encryptor(internalKey || local.internalKey);
        
        if (data.secretKey && !await __cryptor.verify(data.secretKey)) {
          await lib.lockData(map);
          return reject('Can\'t decrypt data from cloud.\nPlease review your encryption key on the option page.');
        }

        if (local.syncLocked) {
          await lib.unlockData(map);
        }

        if (!local.appId) {
          local.appId = initApp();
        }

        await chrome.storage.sync.set({applicationId: local.appId});
        await lib.delay();
        await sync(map);
        await lib.updateCaches();
      }

      __cryptor = null;
      resolve();
    } catch (er) {
      reject(er);
    }
  });
}

export async function resync(oldKey: string, newKey: string) {
  await log(colors.RED, '=>=>=> start ReSync...');

  await start(oldKey);
  await log(colors.RED, '=>=>=> synced old ReSyncing ...');

  return lib.startProcess(async (resolve, reject) => {
    let data = await chrome.storage.sync.get(['secretKey', 'applicationId']);
    let local = await chrome.storage.local.get(['syncEnabled', 'internalKey', 'syncLocked', 'appId']);
  
    if (data.applicationId && local.appId && data.applicationId === local.appId 
        && local.syncEnabled && local.internalKey && !local.syncLocked) {
      __cryptor = new Encryptor(newKey);
      let data = await chrome.storage.sync.get();
      let map: {[key: number]: ISyncPair} = await lib.getDBPair(data);
  
      await sync(map, true);
      resolve();
      await log(colors.RED, '=>=>=> ReSync is completed!');
    }
  });
}

export async function onStorageChanged(changes: {[key: string]: chrome.storage.StorageChange}, area: chrome.storage.AreaName) {
  let local = await chrome.storage.local.get(['syncEnabled', 'internalKey', 'syncLocked', 'appId']);

  if (local.syncEnabled && local.internalKey && !local.syncLocked) {
    let data = await chrome.storage.sync.get(['secretKey', 'applicationId']);
    let cryptor = new Encryptor(local.internalKey);
    
    if (data.secretKey && !await cryptor.verify(data.secretKey)) {
      return 'Can\'t decrypt data from cloud.\nPlease review your encryption key on the option page.';
    }

    if (data.applicationId && local.appId && data.applicationId !== local.appId) {
      return await processChanges(changes, area);
    }
  }
}

//----------------------------------------------------------------------------------------------------------------------
async function sync(map: {[key: number]: ISyncPair}, resync?: boolean): Promise<void> {
  var deleted: number[] = [];
  var desync: number[] = [];
  var changes: boolean = false;
  await log(colors.BLUE, 'sync.pair...', map);

  for (let i = 0, keys = Object.keys(map); i < keys.length; i++) {
    const item = map[parseInt(keys[i])];
    
    if (item.cloud && (!item.db || item.db.updated < item.cloud.u)) {
      await saveToDB(item);
      changes = true;
      continue;
    }

    if (item.db && item.cloud && item.db.deleted) {
      lib.remove(item.db);
      await removeFromCloud(item.db, item.cloud.chunks);

      deleted.push(item.db.id);
      changes = true;
      continue;
    }

    if (item.db && item.cloud && !item.db.sync) {
      lib.markDesync(item.db);
      await removeFromCloud(item.db, item.cloud.chunks);
      
      desync.push(item.db.id);
      changes = true;
      continue;
    }

    if (item.db && item.db.sync && (!item.cloud || item.db.updated > item.cloud.u || resync)) {
      await saveToCloud(item.db);
      changes = true;
    }

    // if (item.db && item.cloud && (item.db.deleted || item.cloud.rmsync)) {
    //   await removeFromCloud(item.db, item.cloud.chunks);
    //   continue;
    // }

    // if (item.db && !item.cloud && item.db.deleted) {
    //   lib.remove(item.db);
    //   continue;
    // }

    // if (item.db && item.cloud && item.db.deleted) {
    //   await removeFromCloud(item.db, item.cloud.chunks);
    //   lib.remove(item.db);
    //   changes = true;
    //   continue;
    // }

    // if (item.db && item.cloud && !item.db.sync) {
    //   await removeFromCloud(item.db, item.cloud.chunks);
    //   changes = true;
    //   // await desyncFromCloud(item.db, item.cloud.chunks);
    //   continue;
    // }

    // if (item.db && !item.cloud && item.db.inCloud) {
    //   // lib.remove(item.db);
    //   log('delete local', item.db);
    //   changes = true;
    //   continue;
    // }
  }
  
  if (changes) {
    await lib.delay();
    await chrome.storage.sync.set({
      deleted: deleted.length? deleted : null,
      desync: desync.length? desync : null,
      secretKey: await __cryptor.secretKey(),
    });
    await log(colors.RED, 'sync.changes', {
      deleted: deleted.length? deleted : null,
      desync: desync.length? desync : null,
      secretKey: await __cryptor.secretKey()});
    await lib.delay();
    await chrome.storage.local.set({restSyncedItems: lib.default.rest()});
  }
  
  return await lib.delay();
}

function saveToDB(item: ISyncPair): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    var [title, description]: string[] = item.cloud.d.split('|');
    var note: IDBNote = {
      id: item.cloud.i,
      title: await __cryptor.decrypt(title),
      description: await __cryptor.decrypt(description),
      order: item.cloud.o,
      cState: item.cloud.s,
      updated: item.cloud.u,
      created: item.cloud.c,
      deleted: false,
      sync: 1,
      preview: false,
      inCloud: true
    };
  
    if (item.db) {
      note.deleted = item.db.deleted;
      note.sync = item.db.sync;
      note.preview = item.db.preview;
  
      idb.update(note, resolve, reject);
      await log('\t\t', 'setDBItems.update', note);
    } else {
      idb.add(note, resolve, reject);
      await log('\t\t', 'setDBItems.add', note);
    }
  });
}

async function saveToCloud(item: IDBNote) {
  const chunks:{[key: string]: ISyncNote} = await lib.zipNote(__cryptor, item);
  const keys = Object.keys(chunks);

  lib.subtractItems(keys.length);

  if (lib.default.rest() <= 0) {
    return lib.logger(new Error('Max notes quota exceeded!'));
  }

  var data: {[key: string]: ISyncNote} = {};
  for (let j = 0; j < keys.length; j++) {
    const key: string = keys[j];
    
    // await lib.delay();
    // await chrome.storage.sync.set({[key]: chunks[key]});
    
    data[key] = chunks[key];
    await log(colors.RED, 'saveToCloud.chunk', {[key]: chunks[key]}, 'remains', lib.default.rest());
  }

  await lib.delay();
  await chrome.storage.sync.set(data);
  lib.markSynced(item);
}

async function removeFromCloud(item: IDBNote, chunks: number) {
  for (let i = 0; i < chunks; i++) {
    await lib.delay();

    var result = await chrome.storage.sync.get([`item_${item.id}_${i}`]);
    await chrome.storage.sync.remove(`item_${item.id}_${i}`);

    await log(colors.RED, 'deleteCloud.chunk', result, 'remains', lib.default.rest());
  }

  lib.addItems(chunks);
  lib.markDesync(item);
  // lib.remove(item);
}

async function desyncFromCloud(item: IDBNote, chunks: number) {
  await removeFromCloud(item, chunks);

  lib.subtractItems(1);

  await lib.delay();
  await chrome.storage.sync.set({[`item_${item.id}_0`]: {rmsync: true, id: item.id}});
  await log(colors.RED, 'rmSyncCloud.rmsync.chunk', {rmsync: true, id: item.id}, 'remains', lib.default.rest());

  // lib.markDesync(item);
}

//----------------------------------------------------------------------------------------------------------------------
async function processChanges(changes: {[key: string]: chrome.storage.StorageChange}, area: chrome.storage.AreaName) {
  await log('----------------------------------------------------------------------------------------------------');
  await log('changes', changes);
  await log('----------------------------------------------------------------------------------------------------');


  const tester: RegExp = /^item\_[\d]+$/;
  var data: {[key: string]: any} = {};

  for(let key in changes) {
    const item: chrome.storage.StorageChange = changes[key];

    if (tester.test(key) && item.newValue) {
      data[key] = item;
    }
  }

  if (Object.keys(data).length > 0) {
    let map: {[key: number]: ISyncPair} = await lib.getDBPair(data);

    for (let i = 0, keys = Object.keys(map); i < keys.length; i++) {
      const item = map[parseInt(keys[i])];
      
      if (item.cloud && (!item.db || item.db.updated < item.cloud.u)) {
        await log('save to DB', item);
        await saveToDB(item);
        continue;
      }
    }
  }

  if(changes.deleted && changes.deleted.newValue || changes.desync && changes.desync.newValue) {
    await log('\t\t\t', 'onChanged {deleted:', changes.deleted, 'desync:', changes.desync, '}');
    await updateDBItems(<number[]>changes.deleted, <number[]>changes.desync, 'onChanged');
  }

  await lib.updateCaches();
}

async function updateDBItems(deleted: number[], desync: number[], action: string) {
  if (!deleted.length && !desync.length) {
    return;
  }

  // TODO Do we need this?
  var notes: IDBNote[] = await lib.getDBNotes();
  let deleteItems: IDBNote[] = notes.filter(n => deleted.indexOf(n.id) > -1);
  let desyncItems: IDBNote[] = notes.filter(n => desync.indexOf(n.id) > -1);

  for (let i = 0; i < deleteItems.length; i++) {
    const note = deleteItems[i];

    console.warn('\t\t\t\t', `1.0 ${action}.updateDBItems.delete`, JSON.parse(JSON.stringify(note)));
    idb.remove(note.id, lib.logger);
  }

  for (let i = 0; i < desyncItems.length; i++) {
    const note = desyncItems[i];
    
    if (note.sync) {
      note.sync = 0;
      console.warn('\t\t\t\t', `2.0 ${action}.updateDBItems.rmsync`, JSON.parse(JSON.stringify(note)));
      idb.update(note, null, lib.logger);
    }
  }
}
