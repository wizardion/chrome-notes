import {ILog,ILogCommand} from './interfaces';

var _database: IDBDatabase;
var _queueList: ILogCommand[] = [];

function logError(e: (Error|Event)) {
  // @ts-ignoree
  console.error('Database error: ', e.message || e.target.error || e.target.result || e.target);
}

function upgradeNeeded(event: Event) {
  // @ts-ignore
  var db:IDBDatabase = event.target.result;
  // @ts-ignore
  var request:IDBOpenDBRequest = event.target;
  var objectStore:IDBObjectStore = null;

  if (!db.objectStoreNames.contains('logs')) {
    objectStore = db.createObjectStore('logs', {autoIncrement : true, keyPath: 'id'});
  } else {
    objectStore = request.transaction.objectStore('logs');
  }

  // if (!objectStore.indexNames.contains('order')) {
  //   objectStore.createIndex('order', 'order', {unique: true});
  // }
}

function initDB(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!_database) {
      var request = indexedDB.open('MyLogs', 1);
  
      request.onerror = reject;
      request.onupgradeneeded = upgradeNeeded;
  
      return request.onsuccess = (e: Event) => {
        try {
          // @ts-ignore
          _database = e.target.result;
          resolve(_database);
        } catch (er) {
          reject(er);
        }
      };
    }
  
    resolve(_database);
  });
}

function initObjectStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return new Promise<IDBObjectStore>(async (resolve, reject) => {
    try {
      var db = await initDB();
      var transaction:IDBTransaction = db.transaction('logs', mode);

      transaction.onerror = reject;
      resolve(transaction.objectStore('logs'));
    } catch (er) {
      reject(er);
    }
  });
}

export function getAll(): Promise<ILog[]> {
  return new Promise<ILog[]>(async (resolve, reject) => {
    try {
      var store:IDBObjectStore = await initObjectStore('readonly');
      // var index: IDBIndex = store.index('order');
      // var request: IDBRequest = index.getAll();
      var request: IDBRequest = store.getAll();
  
      // @ts-ignores
      request.onsuccess = (e: Event) => resolve(<ILog[]>e.target.result);
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

export function put(...args: any[]): Promise<ILog> {
  return new Promise<ILog>(async (resolve, reject) => {
    try {
      var item: ILog = {data: JSON.stringify(args)};
      var store:IDBObjectStore = await initObjectStore('readwrite');
      var request: IDBRequest = store.add(item);

      request.onsuccess = (e: Event) => {
        // @ts-ignores
        item.id = <number>e.target.result;
        resolve(item);
      };
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

export function clear(): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      var store:IDBObjectStore = await initObjectStore('readwrite');
      var request: IDBRequest = store.clear();

      // @ts-ignores
      request.onsuccess = () => resolve();
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