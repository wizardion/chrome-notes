/* import idb from './idb';
import {IDBNote, IDBSyncNote, ISyncPair, ISyncEvent} from './interfaces';
import * as encrypter from './encrypter_copy';

var _busy_: Promise<void> = null;
const __delay__: number = 2000;


function log(e: Error) {
  console.error('Sync ERROR', e);
}

async function canDencrypt(internalKey: string, errorCallBack?: () => void): Promise<boolean> {
  if (await encrypter.setKey(internalKey).catch(errorCallBack)) {
    let {syncKey} = await chrome.storage.sync.get(['syncKey']).catch(errorCallBack) || {};

    return !syncKey || await encrypter.checkSyncKey(syncKey).catch(errorCallBack) || false;
  }

  return false;
}

function initNotes(callback?: Function) {
  idb.load((data: IDBNote[]) => {
    if (callback && data) {
      callback(data);
    }
  });
}

function itemsForSync(callback: Function, errorCallback: () => void) {
  initNotes((dbNotes: IDBNote[]) => {
    chrome.storage.sync.get(null, async (result) => {
      let items: IDBSyncNote[] = await unzip(result || {}).catch(errorCallback) || null;

      if (items !== null) {
        callback(mapSyncNotes(dbNotes, items));
      }
    });
  });
}

async function unzip(data: {[key: string]: any}): Promise<IDBSyncNote[]> {
  const tester: RegExp = /^item\_[\d]+$/;
  var notes: IDBSyncNote[] = [];
  
  console.log('\t', 'unzip', data);

  if (data.internalKey && !await canDencrypt(data.internalKey)) {
    throw Error('Can\'t decrypt data from cloud.\nPlease review your encryption key on the option page.');
  }

  for(let key in data) {
    if (tester.test(key)) {
      notes.push(<IDBSyncNote>data[key]);
    }
  }

  return notes;
}

function mapSyncNotes(dbNotes: IDBNote[], saved: IDBSyncNote[]): {[id: number]: ISyncPair} {
  let map: {[id: number]: ISyncPair} = {};
  let max_items = chrome.storage.sync.MAX_ITEMS - 12;
  let max = dbNotes.length > max_items? max_items : dbNotes.length;

  for (let i = 0; i < saved.length; i++) {
    const item = saved[i];
    map[item.i] = {db: null, cloud: item};
  }

  for (let i = 0; i < max; i++) {
    const item = dbNotes[i];

    if (map[item.id] && map[item.id].db) {
      console.warn('\t\t', 'mapSyncNotes.dublicated', item);
    }
  
    if (map[item.id]) {
      map[item.id].db = item;
    } else {
      map[item.id] = {db: item, cloud: null};
    }
  }

  return map;
}

function getEncrypted(item: IDBNote): Promise<IDBSyncNote> {
  return new Promise<IDBSyncNote>((resolve, reject) => {
    encrypter.encrypt(item.title).then((title: string) => {
      encrypter.encrypt(item.description).then((description) => {
        resolve({
          i: item.id,
          t: title,
          d: description,
          o: item.order,
          s: item.cState,
          u: item.updated,
          c: item.created,
        });
      }).catch(() => reject());
    }).catch(() => reject());
  });
}

async function getDecrypted(item: IDBSyncNote): Promise<IDBSyncNote> {
  return new Promise<IDBSyncNote>((resolve, reject) => {
    encrypter.decrypt(item.t).then((title: string) => {
      encrypter.decrypt(item.d).then((description) => {
        resolve({
          i: item.i,
          t: title,
          d: description,
          o: item.o,
          s: item.s,
          u: item.u,
          c: item.c,
        });
      }).catch(() => reject());
    }).catch(() => reject());
  });
}

async function setDBItems(items: ISyncPair[]) {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    // @ts-ignore
    const cloud: IDBSyncNote = await getDecrypted(item.cloud);

    if (item.db) {
      item.db.title = cloud.t,
      item.db.description = cloud.d,
      item.db.order = cloud.o,
      item.db.cState = cloud.s,
      item.db.updated = cloud.u,
      item.db.created = cloud.c,

      idb.update(item.db);
      console.log('\t\t', 'setDBItems.update', item.db);
    } else {
      let db: IDBNote = {
        id: cloud.i,
        title: cloud.t,
        description: cloud.d,
        order: cloud.o,
        cState: cloud.s,
        updated: cloud.u,
        created: cloud.c,
        deleted: false,
        sync: 1,
        preview: false
      };

      idb.add(db);
      console.log('\t\t', 'setDBItems.add', db);
    }
  }
}

async function updateDBItems(deleted: number[], unsynced: number[], action: string): Promise<void> {
  return new Promise<void>(resolve => {
    if (!deleted.length && !unsynced.length) {
      return resolve();
    }

    initNotes((notes: IDBNote[]) => {
      let deleteItems: IDBNote[] = notes.filter(n => deleted.indexOf(n.id) > -1);
      let unsyncItems: IDBNote[] = notes.filter(n => unsynced.indexOf(n.id) > -1);

      for (let i = 0; i < deleteItems.length; i++) {
        const note = deleteItems[i];

        console.warn('\t\t\t\t', `1.0 ${action}.updateDBItems.delete`, JSON.parse(JSON.stringify(note)));
        idb.remove(note.id);
      }

      for (let i = 0; i < unsyncItems.length; i++) {
        const note = unsyncItems[i];
        
        if (note.sync) {
          note.sync = 0;
          console.warn('\t\t\t\t', `2.0 ${action}.updateDBItems.uncync`, JSON.parse(JSON.stringify(note)));
          idb.update(note);
        }
      }

      resolve();
    });    
  }).catch(log).finally(() => _busy_ = null);
}

async function setSyncItem(item: IDBNote, action: string) {
  return new Promise(async (resolve) => {
    var promise: Promise<void> = null;

    if (action === 'sync') {
      var data: IDBSyncNote = await getEncrypted(item);
      promise = chrome.storage.sync.set({['item_' + item.id]: data});
    }

    if (action === 'delete') {
      promise = chrome.storage.sync.remove('item_' + item.id);
    }

    if (action === 'unsync') {
      promise = chrome.storage.sync.set({['item_' + item.id]: {unsync: true, id: item.id}});
    }

    if (promise) {
      promise.then(() => {
        if(chrome.runtime.lastError) {
          console.warn('\t\tsetSyncItem.remove.ERROR.syncItem: ', chrome.runtime.lastError);
        }
      }).catch((reason) => {
        console.warn('\t\tsetSyncItem.remove.ERROR.syncItem: ', reason);
      });
    }
    
    if (item) {
      console.log('\t\t\t\t', 'setSyncItem.set', {['item_' + item.id]: item, action: action});
    }
    
    setTimeout(resolve, __delay__);
  });
}

async function syncItems(items: ISyncEvent[]): Promise<void> {
  return new Promise<void>(async (resolve) => {
    await setSyncItem(null, null);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      await setSyncItem(item.db, item.action);
    }
    
    resolve();
  });
}

async function sync(map: {[key: number]: ISyncPair}): Promise<void> {
  console.log('0. sync...');
  let itemsToSync: ISyncEvent[] = [];
  var itemsToUpdate: ISyncPair[] = [];
  var itemsToDelete: number[] = [];
  let syncKey = await encrypter.getSyncKey();

  for(let key in map) {
    const item = map[key];

    if (item.cloud && !item.cloud.unsync && (!item.db || item.db.updated < item.cloud.u)) {
      itemsToUpdate.push({cloud: item.cloud, db: item.db});
      console.log('\t\t\t', '1.0 itemsForSync.update.db', item);
    }

    if (item.db && item.cloud && (item.db.deleted || item.cloud.unsync)) {
      itemsToSync.push({db: item.db, action: 'delete'});
      console.log('\t\t\t', '2.0 itemsForSync.delete', item);
      continue;
    }

    if (item.db && !item.cloud && item.db.deleted) {
      itemsToDelete.push(item.db.id);
      console.log('\t\t\t', '2.1 itemsForSync.delete.db', item);
      continue;
    }

    if (item.db && item.cloud && item.cloud && !item.db.sync) {
      itemsToSync.push({db: item.db, action: 'unsync'});
      console.log('\t\t\t', '3.0 itemsForSync.unsync', item);
      continue;
    }

    if (item.db && item.db.sync && (!item.cloud || item.db.updated > item.cloud.u)) {
      itemsToSync.push({db: item.db, action: 'sync'});
      console.log('\t\t\t', '4.0 itemsForSync.sync', item);
      continue;
    }
  }

  console.log('1. sync.key_map');
  await setDBItems(itemsToUpdate);
  console.log('2. sync.setDBItems');
  await updateDBItems(itemsToDelete, [], 'itemsForSync');
  console.log('3. sync.updateDBItems');
  var result = syncItems(itemsToSync);
  
  //TODO DEBUG
  result.then(async () => {
    await chrome.storage.sync.set({'syncKey': syncKey});
    await chrome.storage.local.set({'lastSynced': new Date().getTime()});

    console.log('sync is completed.busy');
    
    chrome.storage.sync.getBytesInUse().then((value) => {
      console.log('bytesInUse', value);
      console.log('--------------------------------------------------------------------------------');
    });
  });

  return result;
}

export function isBusy(): Promise<void> {
  return _busy_;
}

export function start(): Promise<void> {
  _busy_ = new Promise<void>(async (resolve, reject) => {
    let result = await chrome.storage.local.get(['syncEnabled', 'internalKey', 'shareKey', 'lastSynced']).catch(reject) || {};

    // TODO take control of lastSynced
    if (result.syncEnabled && result.internalKey && await encrypter.setKey(result.internalKey).catch(reject)) {
      return itemsForSync((map: {[key: number]: ISyncPair}) => sync(map).catch(reject).then(resolve), reject);
    }

    // TODO take control of lastSynced
    if (result.syncEnabled && !result.lastSynced && result.shareKey) {
    // if (result.syncEnabled && !result.internalKey && result.shareKey) {
      console.warn('IMPLEMENT SHARE KEY!');
    }

    resolve();
  }).catch(log).finally(() => _busy_ = null);
  return _busy_;
}

export function syncBack(oldKey: string, newKey: string) {
  _busy_ = new Promise<void>(async (resolve, reject) => {
    let result = await chrome.storage.local.get(['syncEnabled']).catch(reject) || {};

    if (result.syncEnabled && await encrypter.setKey(oldKey).catch(reject)) {
      return itemsForSync((map: {[key: number]: ISyncPair}) => {
        sync(map).catch(reject).then(() => {
          let itemsToSync: ISyncEvent[] = [];

          for(let key in map) {
            const item = map[key];

            if (item.db && item.db.sync) {
              itemsToSync.push({db: item.db, action: 'sync'});
            }
          }

          encrypter.setKey(newKey).catch(reject).then(async () => {
            let syncKey = await encrypter.getSyncKey();
            let l = syncItems(itemsToSync).catch(reject).then(resolve);
            
            //DEBUG
            l.then(async (v2) => {
              await chrome.storage.sync.set({'syncKey': syncKey});
              await chrome.storage.local.set({'lastSynced': new Date().getTime()});
              console.log('re-sync is completed', v2);
  
              chrome.storage.sync.getBytesInUse().then((value) => {
                console.log('bytesInUse', value);
                console.log('--------------------------------------------------------------------------------');
              });
            });
          });
        });
      }, reject);
    }

    resolve();
  }).catch(log).finally(() => _busy_ = null);
}

export async function setOptions(share: boolean) {
  chrome.storage.sync.set({shareKey: share});
}

async function syncSettings(sync: {shareKey: boolean}) {
  var local:{shareKey?: boolean} = await chrome.storage.local.get(['shareKey']);

  if (local.shareKey !== sync.shareKey) {
    await chrome.storage.local.set({shareKey: !!sync.shareKey});
  }
}

export function onChanged(changes: {[key: string]: chrome.storage.StorageChange}, area: chrome.storage.AreaName) {
  _busy_ = new Promise<void>(async (resolve, reject) => {
    const tester: RegExp = /^item\_[\d]+$/;
    var deleted: number[] = [];
    var unsynced: number[] = [];

    if (area === 'sync') {
      if (changes.settings) {
        const settings: chrome.storage.StorageChange = changes.settings;

        await syncSettings(settings.newValue).catch(reject);
        return resolve();
      }

      for(let key in changes) {
        const item: chrome.storage.StorageChange = changes[key];

        if (tester.test(key)) {
          if (item.oldValue && !item.newValue && !item.oldValue.unsync) {
            deleted.push(item.oldValue.id);
          }

          if (item.oldValue && item.newValue && item.newValue.unsync === true) {
            unsynced.push(item.newValue.id);
          }
        }
      }
    }

    if(deleted.length || unsynced.length) {
      console.log('\t\t\t', 'onChanged {deleted:', deleted, 'unsynced:', unsynced, '}');
    }

    await updateDBItems(deleted, unsynced, 'onChanged');
    resolve();
  }).catch(log).finally(() => _busy_ = null);
}
 */