import * as idb from 'modules/db/idb';
import { ISyncPair, ISyncItemInfo, ISyncInfo, IdentityInfo } from './interfaces';
import { IDBNote } from 'modules/db/interfaces';
import { Encryptor } from 'modules/encryption/encryptor';
import { Logger } from 'modules/logger/logger';
import storage from 'modules/storage/storage';
import { fromIDBNoteString, toIDBNoteString } from 'modules/notes/builder';


const logger: Logger = new Logger('lib.ts');


export async function unzip(item: ISyncItemInfo, cryptor?: Encryptor): Promise<IDBNote> {
  const title = cryptor ? await cryptor.decrypt(item.t) : item.t;
  const description = cryptor ? await cryptor.decrypt(item.d) : item.d;

  const data: IDBNote = {
    id: item.i,
    title: title,
    description: description,
    order: item.o,
    preview: false,
    cState: item.s,
    pState: null,
    html: null,
    updated: item.u,
    created: item.c,
    deleted: false
  };

  return data;
}

export async function zip(item: IDBNote, cryptor?: Encryptor): Promise<ISyncItemInfo> {
  const title = cryptor ? await cryptor.encrypt(item.title) : item.title;
  const description = cryptor ? await cryptor.encrypt(item.description) : item.description;

  const data: ISyncItemInfo = {
    i: item.id,
    t: title,
    d: description,
    o: item.order,
    s: item.cState,
    u: item.updated,
    c: item.created
  };

  return data;
}

function map(items: IDBNote[], cloud: ISyncItemInfo[]): ISyncPair[] {
  const map: { [id: number]: ISyncPair } = {};
  const pairs: ISyncPair[] = []

  for (let i = 0; i < cloud.length; i++) {
    const pair: ISyncPair = { db: null, cloud: cloud[i] };

    map[pair.cloud.i] = pair;
    pairs.push(pair);
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (map[item.id] && map[item.id].db) {
      logger.warn('\t\t', 'mapSyncNotes.duplicated', item);
    }

    if (!map[item.id]) {
      let pair: ISyncPair = { db: item, cloud: null };

      map[item.id] = pair;
      pairs.push(pair);
    } else {
      map[item.id].db = item;
    }
  }

  return pairs;
}

export async function getDBPair(data: ISyncItemInfo[]): Promise<ISyncPair[]> {
  return map(await idb.dump(), data);
}

export async function lock(reason: string) {
  const identityInfo: IdentityInfo = <IdentityInfo>await storage.local.get('identityInfo');

  if (!identityInfo.locked) {
    identityInfo.locked = true;
    await storage.local.sensitive('identityInfo', identityInfo);
  }
}
