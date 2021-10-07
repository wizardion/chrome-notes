import {IDBNote, IDBEvent} from './interfaces';

var database: IDBDatabase;


function logError(event: Event) {
  // @ts-ignoree
  console.error('Database error: ', event.target.error);
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

function init(event: IDBEvent) {
  console.log('init', {'database': database});

  if (!database) {
    var request = indexedDB.open('MyNotes', 1);

    request.onerror = logError;
    request.onupgradeneeded = upgradeNeeded;
    request.onsuccess = (e: Event) => {
      // @ts-ignore
      database = e.target.result;
      event.then();

      console.log('init.onsuccess', {'database': database});
    };

    return;
  }

  event.then();
}

function initObjectStore(prommise: IDBEvent) {
  var event: IDBEvent = {then: () => {
    var transaction:IDBTransaction = database.transaction('notes', "readwrite");

    transaction.onerror = logError;
    prommise.then(transaction.objectStore("notes"));
  }};

  init(event);
  /* if (!result.result) {
    init().then = () => {
      var transaction:IDBTransaction = database.transaction('notes', "readwrite");
  
      transaction.onerror = logError;
      result.then(transaction.objectStore("notes"));
    };
  } else {
    var transaction:IDBTransaction = database.transaction('notes', "readwrite");
  
    transaction.onerror = logError;
    result.result = transaction.objectStore("notes");
  } */
}

function load(callback: Function) {
  var event: IDBEvent = {then: (objectStore: IDBObjectStore) => {
    console.log('load.initObjectStore.then');

    var index = objectStore.index("order");
    var request = index.getAll();

    //@ts-ignore
    request.onsuccess = (e: Event) => callback(<IDBNote[]>e.target.result);
    request.onerror = logError;
  }};

  initObjectStore(event);
  /* console.log('load.initObjectStore');
  var event = initObjectStore();

  event.then = (objectStore: IDBObjectStore) => {
    console.log('load.initObjectStore.then');

    var index = objectStore.index("order");
    var request = index.getAll();

    //@ts-ignore
    request.onsuccess = (e: Event) => callback(<IDBNote[]>e.target.result);
    request.onerror = logError;
  }; */
}

function add(item: IDBNote, callback?: Function) {
  var event: IDBEvent = {then: (objectStore: IDBObjectStore) => {
    var draft = Object.assign({}, item);
    delete draft.id;
    console.log('db.add', draft, item);
    var request = objectStore.add(draft);

    //@ts-ignore
    request.onsuccess = (e: Event) => callback(<number>e.target.result);
    request.onerror = logError;
  }};

  initObjectStore(event);
  /* console.log('add.initObjectStore');
  var event = initObjectStore();

  event.then = (objectStore: IDBObjectStore) => {
    console.log('add.initObjectStore.then');
    // delete item.id;
    // console.log('db.add', Object.assign({}, item, {id: undefined}));
    var request = objectStore.add(item);

    //@ts-ignore
    request.onsuccess = (e: Event) => callback(<number>e.target.result);
    request.onerror = logError;
  }; */
}

export default {
  init: init,
  load: load,
  add: add,
  update: () => {}, //update,
  setOrder: () => {}, //setOrder,
  setField: () => {}, //setField,
  saveQueue: () => {}, //saveQueue,
  remove: () => {}, //remove,
};