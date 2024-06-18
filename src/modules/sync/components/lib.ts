import { db, IDBNote } from 'modules/db';
import { ISyncPair, ISyncItemInfo, IdentityInfo, ILockInfo } from './models/sync.models';
import { CryptoService } from 'core/services/encryption';
import { LoggerService } from 'modules/logger';
import { encrypt, decrypt } from 'core';
import { storage } from 'core/services';


const logger = new LoggerService('lib.ts');


export async function unzip(item: ISyncItemInfo, cryptor?: CryptoService): Promise<IDBNote> {
  const title = cryptor ? await cryptor.decrypt(item.t) : item.t;
  const description = cryptor ? await cryptor.decrypt(item.d) : item.d;

  const data: IDBNote = {
    id: item.i,
    title: title,
    description: description,
    order: item.o,
    preview: item.p,
    cState: item.s.split(',').map(v => Number(v)),
    pState: item.e,
    updated: item.u,
    created: item.c,
    deleted: 0
  };

  return data;
}

export async function zip(item: IDBNote, cryptor?: CryptoService): Promise<ISyncItemInfo> {
  const title = cryptor ? await cryptor.encrypt(item.title) : item.title;
  const description = cryptor ? await cryptor.encrypt(item.description) : item.description;

  const data: ISyncItemInfo = {
    i: item.id,
    t: title,
    d: description,
    o: item.order,
    s: item.cState?.join(','),
    u: item.updated,
    c: item.created,
    p: item.preview,
    e: item.pState
  };

  return data;
}

function map(items: IDBNote[], cloud: ISyncItemInfo[]): ISyncPair[] {
  const map: { [id: number]: ISyncPair } = {};
  const pairs: ISyncPair[] = [];

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
      const pair: ISyncPair = { db: item, cloud: null };

      map[item.id] = pair;
      pairs.push(pair);
    } else {
      map[item.id].db = item;
    }
  }

  return pairs;
}

export async function getDBPair(data: ISyncItemInfo[]): Promise<ISyncPair[]> {
  return map(await db.dump(), data);
}

export async function unlock() {
  const data = await db.dump();

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    if (item.locked) {
      const title = await decrypt(item.title) as ILockInfo;
      const description = await decrypt(item.description) as ILockInfo;

      item.locked = false;
      item.title = title.title;
      item.description = description.description;
      db.enqueue(item, 'update');
    }
  }

  return db.dequeue();
}

export async function lock(reason: string, ids: number[]) {
  const identityInfo: IdentityInfo = <IdentityInfo> await storage.local.get('identityInfo');

  if (!identityInfo.locked) {
    const data = await db.dump();

    identityInfo.locked = true;

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      if (ids.includes(item.id)) {
        item.locked = true;
        item.title = await encrypt({ title: item.title } as ILockInfo);
        item.description = await encrypt({ description: item.description } as ILockInfo);
        db.enqueue(item, 'update');
      }
    }

    await db.dequeue();
    await storage.local.sensitive('identityInfo', identityInfo);
    await logger.warn(`locking notes, the reason: ${reason}`);
  }
}
