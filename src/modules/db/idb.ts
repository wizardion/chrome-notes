import {IDBNote,IDBCommand} from './interfaces';

var database: IDBDatabase;
var queueList: IDBCommand[] = [];

function logError(e: Event) {
  // @ts-ignoree
  console.error('Database error: ', e.target.error || e.target.result || e.target);
}

function upgradeNeeded(event: Event) {
  // @ts-ignore
  var db:IDBDatabase = event.target.result;
  // @ts-ignore
  var request:IDBOpenDBRequest = event.target;
  var objectStore:IDBObjectStore = null;

  if (!db.objectStoreNames.contains('notes')) {
    objectStore = db.createObjectStore("notes", {autoIncrement : true, keyPath: "id",});
  } else {
    objectStore = request.transaction.objectStore('notes');
  }

  if (!objectStore.indexNames.contains('order')) {
    objectStore.createIndex("order", "order", {unique: false});
  }

  if (!objectStore.indexNames.contains('sync')) {
    objectStore.createIndex("sync", "sync", {unique: false});
  }
}

function init(callback: Function) {
  if (!database) {
    var request = indexedDB.open('MyNotes', 1);
    request.onerror = logError;
    request.onupgradeneeded = upgradeNeeded;
    
    return request.onsuccess = (e: Event) => {
      // @ts-ignore
      database = e.target.result;
      callback();
    };
  }

  callback();
}

function initObjectStore(callback: Function, mode: string) {
  var prommise: Function = () => {
    var transaction:IDBTransaction = database.transaction('notes', "readwrite");

    transaction.onerror = logError;
    callback(transaction.objectStore("notes"));
  };

  init(prommise);
}

function load(callback: Function) {
  var prommise: Function = (objectStore: IDBObjectStore) => {
    var index = objectStore.index("order");
    var request = index.getAll();

    // @ts-ignores
    request.onsuccess = (e: Event) => callback(<IDBNote[]>e.target.result);
    request.onerror = logError;
  };

  initObjectStore(prommise, 'readonly');
}

function add(item: IDBNote, callback?: Function) {
  var prommise: Function = (objectStore: IDBObjectStore) => {
    let {id, ...draft} = item;
    var request = objectStore.add(draft);

    // @ts-ignore
    request.onsuccess = (e: Event) => callback(<number>e.target.result);
    request.onerror = logError;
  };

  initObjectStore(prommise, 'readwrite');
}

// TODO review frequency
function update(item: IDBNote) {
  var prommise: Function = (objectStore: IDBObjectStore) => {
    var request = objectStore.put(item);

    request.onerror = logError;
  };

  initObjectStore(prommise, 'readwrite');
}

function remove(id: number) {
  var prommise: Function = (objectStore: IDBObjectStore) => {
    var request = objectStore.delete(id);

    request.onerror = logError;
  };

  initObjectStore(prommise, 'readwrite');
}

function enqueue(item: IDBNote, command: string) {
  queueList.push({
    item: item,
    name: command
  });
};

function dequeue(errorCallback?: Function) {
  var prommise: Function = (objectStore: IDBObjectStore) => {
    queueList.forEach((command: IDBCommand) => {      
      var request = objectStore.put(command.item);

      request.onerror = logError;
    });

    queueList.splice(0);
  };

  initObjectStore(prommise, 'readwrite');
}

export default {
  init: init,
  load: load,
  add: add,
  update: update,
  enqueue: enqueue,
  // setField: () => {}, //setField,
  dequeue: dequeue,
  remove: remove,
};