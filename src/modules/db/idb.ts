import {IDBNote,IDBCommand} from './interfaces';
import {Logger} from '../logger/logger';

const logger: Logger = new Logger('db.ts');
var __database: IDBDatabase;
var __queueList: IDBCommand[] = [];


function logError(e: (Error|Event|any)) {
  logger.error('DB ERROR', e.stack || e.message || e.cause || e, e.target);
}

function generateId(): number {
  return new Date().getTime();
}

function upgradeNeeded(db:IDBDatabase, request:IDBOpenDBRequest) {
  var objectStore:IDBObjectStore = null;

  if (!db.objectStoreNames.contains('notes')) {
    objectStore = db.createObjectStore("notes", {autoIncrement : false, keyPath: "id",});
  } else {
    objectStore = request.transaction.objectStore('notes');
  }

  if (!objectStore.indexNames.contains('order')) {
    objectStore.createIndex("order", "order", {unique: false});
  }
}

function initDB(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!__database) {
      try {
        var request = indexedDB.open('MyNotes', 1);

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
  return new Promise<IDBObjectStore>(async (resolve, reject) => {
    try {
      var db = await initDB();
      var transaction:IDBTransaction = db.transaction('notes', mode);

      transaction.onerror = reject;
      resolve(transaction.objectStore('notes'));
    } catch (er) {
      reject(er);
    }
  });
}

export function load(): Promise<IDBNote[]> {
  return new Promise<IDBNote[]>(async (resolve, reject) => {
    try {
      var store: IDBObjectStore = await initObjectStore('readonly');
      var index: IDBIndex = store.index('order');
      var request: IDBRequest = index.getAll();
  
      request.onsuccess = (e: Event) => resolve(<IDBNote[]>(e.target as IDBRequest).result);
      request.onerror = (e: Event) => {
        logError(e); 
        reject(e);
      };
    } catch (error) {
      logError(error); 
      reject(error);
    }
  });
}

export function get(id: number): Promise<IDBNote[]> {
  return new Promise<IDBNote[]>(async (resolve, reject) => {
    try {
      var store: IDBObjectStore = await initObjectStore('readonly');
      var index: IDBIndex = store.index('order');
      var request: IDBRequest = index.get(id);
  
      request.onsuccess = (e: Event) => resolve(<IDBNote[]>(e.target as IDBRequest).result);
      request.onerror = (e: Event) => {
        logError(e); 
        reject(e);
      };
    } catch (error) {
      logError(error); 
      reject(error);
    }
  });
}

export function add(item: IDBNote): Promise<number> {
  return new Promise<number>(async (resolve, reject) => {
    try {
      var store:IDBObjectStore = await initObjectStore('readwrite');
      var request: IDBRequest = store.add({...item, id: (!item.id || item.id < 1)? generateId() : item.id});

      // @ts-ignores
      request.onsuccess = (e: Event) => resolve(<number>e.target.result);
      request.onerror = (e: Event) => {
        logError(e); 
        reject(e);
      };
    } catch (error) {
      logError(error); 
      reject(error);
    }
  });
}

export function update(item: IDBNote, objectStore?: IDBObjectStore): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      var store:IDBObjectStore = objectStore || await initObjectStore('readwrite');
      var request: IDBRequest = store.put(item);

      // @ts-ignores
      request.onsuccess = (e: Event) => resolve();
      request.onerror = (e: Event) => {
        logError(e); 
        reject(e);
      };
    } catch (error) {
      logError(error); 
      reject(error);
    }
  });
}

export function remove(item: (IDBNote|number)): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      var store:IDBObjectStore = await initObjectStore('readwrite');
      var request: IDBRequest = store.delete(typeof(item) === 'number'? item : item.id);

      // @ts-ignores
      request.onsuccess = (e: Event) => resolve();
      request.onerror = (e: Event) => {
        logError(e); 
        reject(e);
      };
    } catch (error) {
      logError(error); 
      reject(error);
    }
  });
}

export function enqueue(item: IDBNote, command: string) {
  __queueList.push({
    item: item,
    name: command
  });
};

export function dequeue(): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      var store:IDBObjectStore = await initObjectStore('readwrite');

      while(__queueList.length) {
        const command: IDBCommand = __queueList.shift();
        
        await update(command.item, store);
      }

      resolve();
    } catch (error) {
      logError(error); 
      reject(error);
    }
  });
}

// function exists(callback?: Function, errorCallBack?: (e: (Error|Event)) => void) {
//   indexedDB.databases().then((result) => {
//     for(let i = 0; i < result.length; i++) {
//       const db = result[0];

//       if (db.name === 'MyNotes') {
//         return callback(true);
//       }
//     }

//     callback(false);
//   }).catch(errorCallBack);
// }