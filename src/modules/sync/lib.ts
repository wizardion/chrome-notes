import idb from '../db/idb';
import {ISyncNote, ISyncPair, ISyncEvent, IPromiseDecorator} from './interfaces';
import {IDBNote} from '../db/interfaces';
import { Encryptor } from '../encryption/encryptor';

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

const colors = {
  RED: '\x1b[31m%s\x1b[0m',
  GREEN: '\x1b[32m%s\x1b[0m',
  BLUE: '\x1b[34m%s\x1b[0m',
};

var __promise: Promise<void> = null;
var __maxItems: number = 0;
const __delay: number = 2100;


export function logger(e: Error) {
  console.error(colors.RED, 'Sync ERROR', e);
}

export function delay(milliseconds: number = __delay): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

export function subtractItems(value: number) {
  __maxItems -= value;
}

export function addItems(value: number) {
  __maxItems += value;
}

export function startProcess(decorator: IPromiseDecorator): Promise<void> {
  if (__promise) {
    throw Error('The process is still running');
  }

  log('\t::the process is starting!');
  chrome.storage.local.set({syncProcessing: new Date().getTime()});
  __promise = new Promise<void>(decorator);

  __promise.catch(logger);
  __promise.finally(() => {
    __promise = null;
    // _cryptor_ = null;
    __maxItems = 0;
    chrome.storage.local.set({syncProcessing: null});
    log('\t::the process is completed!');
  });

  return __promise;
}

export function getDBNotes(): Promise<IDBNote[]> {
  return new Promise<IDBNote[]>((resolve, reject) => {
    idb.load((data: IDBNote[]) => {
      resolve(data || []);
    }, reject);
  });
}

export function markSynced(item: IDBNote) {
  item.inCloud = true;
  idb.update(item, null, logger);
}

export function markDesync(item: IDBNote) {
  item.inCloud = false;
  idb.update(item, null, logger);
}

export function remove(item: IDBNote) {
  idb.remove(item.id, logger);
}

export function unzip(data: {[key: string]: any}): ISyncNote[] {
  const tester: RegExp = /^item\_[\d]+_\d+$/;
  var buff: {[key: number]: ISyncNote} = {};
  var notes: ISyncNote[] = [];
  __maxItems = (chrome.storage.sync.MAX_ITEMS - 12);

  Object.keys(data).sort().forEach(key => {
    if (tester.test(key)) {
      const item: ISyncNote = <ISyncNote>{...data[key]};
      const id: number = parseInt(key.split('_')[1]);
      var tmp: ISyncNote = buff[id];

      if (!tmp) {
        tmp = item;
        tmp.i = id;
        tmp.chunks = 1;
        buff[id] = tmp;
      } else {
        tmp.d += item.d
        tmp.chunks += 1;
      }

      __maxItems -= 1;
    }
  });

  Object.keys(buff).forEach(key => {
    notes.push(<ISyncNote>buff[parseInt(key)]);
  });

  log(colors.GREEN, 'unzip', {'data': data}, notes, 'max_items', __maxItems);
  return notes;
}

export async function zipNote(cryptor: Encryptor, item: IDBNote): Promise<{[key: string]: ISyncNote}> {
  // const bytes_per_item = chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 25;
  const bytes_per_item = 100;
  var title = await cryptor.encrypt(item.title);
  var description = await cryptor.encrypt(item.description);
  var data: string[] = (title + '|' + description).match(new RegExp(`.{1,${bytes_per_item}}`, 'g'));

  var result:{[key: string]: ISyncNote} = {
    [`item_${item.id}_0`]: {
      d: data[0],
      o: item.order,
      s: item.cState,
      u: item.updated,
      c: item.created
    }
  };

  for (let i = 1; i < data.length; i++) {
    result[`item_${item.id}_${i}`] = {d: data[i]};
  }
  
  return result;
}

function mapData(dbNotes: IDBNote[], cloud: ISyncNote[]): {[id: number]: ISyncPair} {
  let map: {[id: number]: ISyncPair} = {};

  for (let i = 0; i < cloud.length; i++) {
    const item = cloud[i];
    map[item.i] = {db: null, cloud: item};
  }

  for (let i = 0; i < dbNotes.length; i++) {
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

export async function getDBPair(data: {[key: string]: any}): Promise<{[id: number]: ISyncPair}> {
  return mapData(await getDBNotes(), unzip(data));
}

// TODO encrypt local data to increase security.
export async function lockData(map: {[key: number]: ISyncPair}) {
  var cached: IDBNote[] = [];

  for (let i = 0, keys = Object.keys(map); i < keys.length; i++) {
    const item = map[parseInt(keys[i])];

    if (item.db && item.cloud) {
      item.db.locked = true;
      idb.update(item.db, null, logger);
    } else if (item.db) {
      cached.push(item.db);
    }
  }

  saveCachedList(cached);
  chrome.storage.local.set({syncLocked: true});
  chrome.storage.local.remove('internalKey');
}

export async function unlockData(map: {[key: number]: ISyncPair}) {
  var cached: IDBNote[] = [];

  for (let i = 0, keys = Object.keys(map); i < keys.length; i++) {
    const item = map[parseInt(keys[i])];

    if (item.db && item.db.locked) {
      item.db.locked = false;
      idb.update(item.db, null, logger);
    }

    if (item.db) {
      cached.push(item.db);
    }
  }

  saveCachedList(cached);
  chrome.storage.local.remove('syncLocked');
}

export async function updateCaches() {
  var notes: IDBNote[] = await getDBNotes();

  saveCachedList(notes.filter(n => !n.locked));
}

function saveCachedList(notes: IDBNote[] = null) {
  var cache: (string|number)[] = [];

  for (let i = 0; i < Math.min(21, notes.length); i++) {
    const note = notes[i];

    if (note) {
      cache = cache.concat([note.id, note.title, note.updated]);
    }
  }

  chrome.storage.local.set({cachedList: JSON.stringify(cache).replace(/^\[|\]$/gi, '')});
}

export default {
  promise: () => __promise,
  max: (chrome.storage.sync.MAX_ITEMS - 12),
  rest: () => __maxItems,
};