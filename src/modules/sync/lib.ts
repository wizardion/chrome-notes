import * as idb from '../db/idb';
import {ISyncNote, ISyncPair, IPromiseDecorator} from './interfaces';
import {IDBNote} from '../db/interfaces';
import {Encryptor} from '../encryption/encryptor';
import {Logger} from '../logger/logger';
import storage from '../storage/storage';
import {fromIDBNoteString, toIDBNoteString} from '../../builder';


const logger: Logger = new Logger('lib.ts');
var __promise: Promise<void> = null;
var __applicationId: number = null;
var __maxItems: number = 0;
const __delay: number = 2100;


export function errorLogger(e: Error) {
  // @ts-ignoree
  logger.error('Sync ERROR', e.stack || e.message || e.cause || e, e.target);
}

export function initApplication(): number {
  __applicationId = new Date().getTime();

  logger.warn('init app', __applicationId);
  chrome.storage.local.set({applicationId: __applicationId});
  chrome.storage.local.remove('syncProcessing');
  updateCaches();

  return __applicationId;
}

export async function startProcess(decorator: IPromiseDecorator): Promise<void> {
  if (!__promise) {
    __applicationId = <number>(await chrome.storage.local.get(['applicationId']) || {}).applicationId;

    if (!__applicationId) {
      initApplication();
    }

    await chrome.storage.local.set({syncProcessing: new Date().getTime()});
    
    __promise = new Promise<void>(decorator);
    __promise.finally(async () => {
      __promise = null;
      __maxItems = 0;
      await chrome.storage.local.set({syncProcessing: null});
    }).catch(errorLogger);

    return __promise;
  } else {
    return Promise.reject('The process is still running');
  }
}

export function delay(milliseconds: number = __delay): Promise<void> {
  return new Promise<void>(resolve => setTimeout(resolve, milliseconds));
}

export function isBusy(): Promise<boolean> {
  return new Promise<boolean>(async (resolve, reject) => {
    try {
      var local = await chrome.storage.local.get(['syncProcessing']);
      resolve(!!local.syncProcessing);
    } catch (error) { reject(error); }
  });
}

export function wait(): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      var busy: boolean = await isBusy();

      while(busy) {
        await delay(1000);
        busy = await isBusy();
      }

      resolve();
    } catch (error) { reject(error); }
  });
}

export function subtractItems(value: number) {
  __maxItems -= value;
}

export function addItems(value: number) {
  __maxItems += value;
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

  // logger.info('unzip', {'data': data}, notes, 'max_items', __maxItems);
  return notes;
}

export async function zipNote(cryptor: Encryptor, item: IDBNote) {
  const bytes_per_item = 100; //chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 25;
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
      logger.warn('\t\t', 'mapSyncNotes.duplicated', item);
    }
  
    if (map[item.id]) {
      map[item.id].db = item;
    } else {
      map[item.id] = {db: item, cloud: null};
    }
  }

  return map;
}

export async function getDBPair(data: {[key: string]: any}) {
  return mapData(await idb.load(), unzip(data));
}

// TODO encrypt local data to increase security.
export async function lockData(map: {[key: number]: ISyncPair}) {
  var cached: IDBNote[] = [];

  for (let i = 0, keys = Object.keys(map); i < keys.length; i++) {
    const item = map[parseInt(keys[i])];

    if (item.db && item.cloud) {
      item.db.locked = true;
      await idb.update(item.db);
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
      await idb.update(item.db);
    }

    if (item.db) {
      cached.push(item.db);
    }
  }

  saveCachedList(cached);
  chrome.storage.local.remove('syncLocked');
}

export async function updateCaches() {
  logger.info('------------- updateCaches -------------');
  var cache = await storage.cached.get();
  var notes: IDBNote[] = (await idb.load() || []).filter(n => !n.locked);

  logger.info('updateCaches.notes', JSON.parse(JSON.stringify(notes)));

  if (cache.selected && cache.selected.value) {
    let selected = fromIDBNoteString(cache.selected.value);
    let index: number = notes.findIndex(n => n.id === selected.id);

    logger.info('updateCaches.selected', JSON.parse(JSON.stringify(selected)), 'index:', index);

    if (index >= 0) {
      logger.info('updateCaches.toIDBNoteString', toIDBNoteString(notes[index], index));

      await storage.cached.set('selected', toIDBNoteString(notes[index], index));
    } else {
      await storage.cached.remove('selected');
    }
  }

  await saveCachedList(notes);
  logger.info('------------- updateCaches.end -------------');
}

async function saveCachedList(notes: IDBNote[] = []) {
  var cache: (string|number)[] = [];

  for (let i = 0; i < Math.min(21, notes.length); i++) {
    const note = notes[i];

    if (note) {
      cache = cache.concat([note.id, note.title, note.updated]);
    }
  }

  logger.info('list', cache)
  await storage.cached.set('list', JSON.stringify(cache).replace(/^\[|\]$/gi, ''));
}

export default {
  applicationId: async () => __applicationId || <number>(await chrome.storage.local.get(['applicationId']) || {}).applicationId,
  promise: () => __promise,
  max: (chrome.storage.sync.MAX_ITEMS - 12),
  rest: () => __maxItems,
};