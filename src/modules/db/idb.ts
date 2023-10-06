import {IDBNote,IDBCommand, IDBCommandType} from './interfaces';
import {Logger} from '../logger/logger';


const logger: Logger = new Logger('db.ts');
let __database: IDBDatabase;
const __queueList: IDBCommand[] = [];


function logError(e: (Error | Event | any)) {
  logger.error('DB ERROR', e.stack || e.message || e.cause || e, e.target);
}

function generateId(): number {
  return new Date().getTime();
}

function upgradeNeeded(db:IDBDatabase, request:IDBOpenDBRequest) {
  let objectStore:IDBObjectStore = null;

  if (!db.objectStoreNames.contains('notes')) {
    objectStore = db.createObjectStore('notes', {autoIncrement : false, keyPath: 'id',});
  } else {
    objectStore = request.transaction.objectStore('notes');
  }

  if (!objectStore.indexNames.contains('order')) {
    objectStore.createIndex('order', 'order', {unique: false});
  }
}

function initDB(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!__database) {
      try {
        const request = indexedDB.open('MyNotes', 1);

        request.onerror = reject;
        request.onupgradeneeded = (e) => upgradeNeeded(
            <IDBDatabase>(e.target as IDBOpenDBRequest).result, 
            <IDBOpenDBRequest>e.target
        );

        return request.onsuccess = (e: Event) => {
          try {
            __database = (e.target as IDBRequest).result;
            resolve(__database);
          } catch (er) {
            reject(er);
          }
        };
      } catch (error) {
        reject(error);
      }
    }
  
    resolve(__database);
  });
}

function initObjectStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return new Promise<IDBObjectStore>((resolve, reject) => {
    initDB().then((db) => {
      const transaction:IDBTransaction = db.transaction('notes', mode);
      
      transaction.onerror = (er) => reject(er);
      resolve(transaction.objectStore('notes'));
    }).catch(er => reject(er));
  });
}

export function load(): Promise<IDBNote[]> {
  return new Promise<IDBNote[]>((resolve, reject) => {
    initObjectStore('readonly')
      .then((store: IDBObjectStore) => {
        const index: IDBIndex = store.index('order');
        const request: IDBRequest = index.getAll();

        request.onsuccess = (e: Event) => resolve((<IDBNote[]>(e.target as IDBRequest).result).filter(i => !i.deleted));
        request.onerror = (e: Event) => {
          logError((<IDBRequest>e.target).error);
          reject((<IDBRequest>e.target).error);
        };
      })
      .catch((er) => {
        logError(er); 
        reject(er);
      });
  });
}

export function dump(): Promise<IDBNote[]> {
  return new Promise<IDBNote[]>((resolve, reject) => {
    initObjectStore('readonly')
      .then((store: IDBObjectStore) => {
        const index: IDBIndex = store.index('order');
        const request: IDBRequest = index.getAll();
    
        request.onsuccess = (e: Event) => resolve(<IDBNote[]>(e.target as IDBRequest).result);
        request.onerror = (e: Event) => {
          logError((<IDBRequest>e.target).error);
          reject(e.target);
        };
      })
      .catch((er) => {
        logError(er); 
        reject(er);
      });
  });
}

export function get(id: number): Promise<IDBNote> {
  return new Promise<IDBNote>((resolve, reject) => {
    initObjectStore('readonly')
      .then((store: IDBObjectStore) => {
        const request: IDBRequest = store.get(id);
  
        request.onsuccess = (e: Event) => resolve(<IDBNote>(<IDBRequest>e.target).result);
        request.onerror = (e: Event) => {
          logError((<IDBRequest>e.target).error); 
          reject((<IDBRequest>e.target).error);
        };
      })
      .catch((er) => {
        logError(er); 
        reject(er);
      });
  });
}

export function add(item: IDBNote): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    initObjectStore('readwrite')
      .then((store: IDBObjectStore) => {
        const request: IDBRequest = store.add({...item, id: (!item.id || item.id < 1)? generateId() : item.id});

        request.onsuccess = (e: Event) => resolve(<number>(<IDBRequest>e.target).result);
        request.onerror = (e: Event) => {
          logError((<IDBRequest>e.target).error); 
          reject((<IDBRequest>e.target).error);
        };
      })
      .catch((er) => {
        logError(er); 
        reject(er);
      });
  });
}

export function update(item: IDBNote, objectStore?: IDBObjectStore): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    (objectStore? Promise.resolve(objectStore) : initObjectStore('readwrite'))
      .then((store: IDBObjectStore) => {
        const request: IDBRequest = store.put(item);

        request.onsuccess = () => resolve();
        request.onerror = (e: Event) => {
          logError((<IDBRequest>e.target).error); 
          reject((<IDBRequest>e.target).error);
        };
      })
      .catch((er) => {
        logError(er); 
        reject(er);
      });
  });
}

export function remove(item: (IDBNote|number), objectStore?: IDBObjectStore): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    (objectStore? Promise.resolve(objectStore) : initObjectStore('readwrite'))
      .then((store: IDBObjectStore) => {
        const request: IDBRequest = store.delete(typeof(item) === 'number'? item : item.id);

        request.onsuccess = () => resolve();
        request.onerror = (e: Event) => {
          logError((<IDBRequest>e.target).error);
          reject((<IDBRequest>e.target).error);
        };
      })
      .catch((er) => {
        logError(er); 
        reject(er);
      });
  });
}

export function enqueue(item: IDBNote, command: IDBCommandType) {
  __queueList.push({
    item: item,
    type: command
  });
}

export async function dequeue(): Promise<void> {
  try {
    const store = await initObjectStore('readwrite');

    while(__queueList.length) {
      const {item, type} = __queueList.shift();

      if (type === 'update') {
        await update(item, store);
      }
      
      if (type === 'remove') {
        await remove(item, store);
      }
    }
  } catch (error) {
    logError(error); 
  }
}
