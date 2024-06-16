// import {IDBNote,IDBCommand} from './interfaces';
// import {Logger} from '../logger/logger';

// const logger: Logger = new Logger('db.ts');
// var database: IDBDatabase;
// var queueList: IDBCommand[] = [];

// function logError(e: (Error|Event)) {
//   // @ts-ignoree
//   // logger.error('Database error: ', e.message || e.target.error || e.target.result || e.target);
//   // @ts-ignoree
//   logger.error('DB ERROR', e.stack || e.message || e.cause || e, e.target);
// }

// function generateId(): number {
//   return new Date().getTime();
// }

// function upgradeNeeded(event: Event) {
//   // @ts-ignore
//   var db:IDBDatabase = event.target.result;
//   // @ts-ignore
//   var request:IDBOpenDBRequest = event.target;
//   var objectStore:IDBObjectStore = null;

//   if (!db.objectStoreNames.contains('notes')) {
//     //TODO use different type of ID
//     // objectStore = db.createObjectStore("notes", {autoIncrement : true, keyPath: "id",});
//     objectStore = db.createObjectStore("notes", {autoIncrement : false, keyPath: "id",});
//   } else {
//     objectStore = request.transaction.objectStore('notes');
//   }

//   if (!objectStore.indexNames.contains('order')) {
//     objectStore.createIndex("order", "order", {unique: false});
//   }

//   // if (!objectStore.indexNames.contains('sync')) {
//   //   objectStore.createIndex("sync", "sync", {unique: false});
//   // }
// }

// function init(callback: Function, errorCallBack?: (e: (Error|Event)) => void) {
//   if (!database) {
//     var request = indexedDB.open('MyNotes', 1);
//     var eCallback = errorCallBack || logError;

//     request.onerror = eCallback;
//     request.onupgradeneeded = upgradeNeeded;

//     return request.onsuccess = (e: Event) => {
//       try {
//         // @ts-ignore
//         database = e.target.result;
//         callback();
//       } catch (er) {
//         eCallback(er);
//       }
//     };
//   }

//   callback();
// }

// function initObjectStore(callback: Function, mode: IDBTransactionMode, errorCallBack?: (e: (Error|Event)) => void) {
//   const eCallback = errorCallBack || logError;
//   var prommise: Function = () => {
//     try {
//       var transaction:IDBTransaction = database.transaction('notes', mode);

//       transaction.onerror = eCallback;
//       callback(transaction.objectStore("notes"));
//     } catch (er) {
//       eCallback(er);
//     }
//   };

//   init(prommise, eCallback);
// }

// function load(callback: Function, errorCallBack?: (e: (Error|Event)) => void) {
//   const eCallback = errorCallBack || logError;
//   var prommise: Function = (objectStore: IDBObjectStore) => {
//     try {
//       var index = objectStore.index("order");
//       var request = index.getAll();

//       // @ts-ignores
//       request.onsuccess = (e: Event) => {callback(<IDBNote[]>e.target.result);};
//       request.onerror = eCallback;
//     } catch (er) {
//       eCallback(er);
//     }
//   };

//   initObjectStore(prommise, 'readonly', eCallback);
// }

// function add(item: IDBNote, callback?: Function, errorCallBack?: (e: (Error|Event)) => void) {
//   const eCallback = errorCallBack || logError;
//   var prommise: Function = (objectStore: IDBObjectStore) => {
//     try {
//       item.id = item.id < 1? generateId() : item.id;
//       var request = objectStore.add(item);

//       if(callback) {
//         request.onsuccess = (e: Event) => callback(item.id);
//       }
      
//       request.onerror = eCallback;
//     } catch (er) {
//       eCallback(er);
//     }
//   };

//   initObjectStore(prommise, 'readwrite', eCallback);
// }

// // TODO review frequency
// function update(item: IDBNote, onsuccess?: () => void, errorCallBack?: (e: (Error|Event)) => void) {
//   const eCallback = errorCallBack || logError;
//   var prommise: Function = (objectStore: IDBObjectStore) => {
//     var request = objectStore.put(item);
//     request.onerror = eCallback;
//     request.onsuccess = onsuccess
//   };

//   initObjectStore(prommise, 'readwrite', eCallback);
// }

// function remove(id: number, errorCallBack?: (e: (Error|Event)) => void) {
//   const eCallback = errorCallBack || logError;
//   var prommise: Function = (objectStore: IDBObjectStore) => {
//     var request = objectStore.delete(id);

//     request.onerror = logError;
//   };

//   initObjectStore(prommise, 'readwrite', eCallback);
// }

// function enqueue(item: IDBNote, command: string) {
//   queueList.push({
//     item: item,
//     name: command
//   });
// };

// function dequeue(errorCallBack?: (e: (Error|Event)) => void) {
//   var prommise: Function = (objectStore: IDBObjectStore) => {
//     queueList.forEach((command: IDBCommand) => {      
//       var request = objectStore.put(command.item);

//       request.onerror = logError;
//     });

//     queueList.splice(0);
//   };

//   initObjectStore(prommise, 'readwrite', errorCallBack);
// }



// export default {
//   init: init,
//   load: load,
//   add: add,
//   update: update,
//   enqueue: enqueue,
//   // setField: () => {}, //setField,
//   dequeue: dequeue,
//   remove: remove,
//   // getSync: getSync,
//   // exists: exists,
// };
