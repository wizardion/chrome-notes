import { IDBNote, IDBCommand, IDBCommandType } from './models/db.models';
import { LoggerService } from 'modules/logger';


const logger = new LoggerService('db.ts');
let __database: IDBDatabase;
const __queueList: IDBCommand[] = [];

enum ERROR_MESSAGES {
  initiate= 'Failed to initiate the Database.'
}

function logError(e: (Error | Event | any)) {
  let message = '';

  if (e instanceof Event && e.target instanceof IDBOpenDBRequest) {
    message = (<DOMException> (e.target as IDBOpenDBRequest).error).message;
  } else if (e instanceof String) {
    message = <string> e;
  } else if (e instanceof DOMException) {
    message = (e as DOMException).message;
  } else if (e.stack || e.message || e.cause) {
    message = e.stack || e.message || e.cause;
  }

  logger.error(`DB ERROR: ${message}`);
}

function generateId(): number {
  return new Date().getTime();
}

function upgradeNeeded(db:IDBDatabase, request:IDBOpenDBRequest) {
  let objectStore:IDBObjectStore = null;

  if (!db.objectStoreNames.contains('notes')) {
    objectStore = db.createObjectStore('notes', { autoIncrement: false, keyPath: 'id', });
  } else {
    objectStore = request.transaction.objectStore('notes');
  }

  if (objectStore.indexNames.contains('order')) {
    objectStore.deleteIndex('order');
  }

  if (!objectStore.indexNames.contains('order')) {
    objectStore.createIndex('order', 'order', { unique: false });
  }

  if (!objectStore.indexNames.contains('deleted')) {
    objectStore.createIndex('deleted', 'deleted', { unique: false });
  }
}

function initDB(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!__database) {
      try {
        const request = indexedDB.open('MyNotes', 10.2);

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

      transaction.onerror = reject;
      resolve(transaction.objectStore('notes'));
    }).catch(reject);
  });
}

function execute<T>(request: IDBRequest): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = (e: Event) => {
      resolve((e.target as IDBRequest<T>).result);
    };

    request.onerror = (e: Event) => {
      logError(e);
      reject(e);
    };
  });
}

export async function iterate(iterator: (i: IDBNote) => void) {
  try {
    const store = await initObjectStore('readonly');
    const index: IDBIndex = store.index('order');
    const request: IDBRequest = index.openCursor();

    return new Promise<void>((resolve, reject) => {
      request.onsuccess = (e: Event) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;

        if (cursor) {
          const item = <IDBNote> cursor.value;

          if (!item.deleted) {
            iterator(item);
          }

          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = (e: Event) => {
        logError(e);
        reject('Failed to get items from the Database.');
      };
    });
  } catch (error) {
    logError(error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
}

export async function load(): Promise<IDBNote[]> {
  try {
    const store = await initObjectStore('readonly');
    const index: IDBIndex = store.index('order');

    return (await execute<IDBNote[]>(index.getAll())).filter(i => !i.deleted);
  } catch (error) {
    logError(error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
}

export async function deleted(): Promise<IDBNote[]> {
  try {
    const store = await initObjectStore('readonly');
    const index: IDBIndex = store.index('deleted');

    return (await execute<IDBNote[]>(index.getAll())).filter(i => i.deleted);
  } catch (error) {
    logError(error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
}

export async function dump(): Promise<IDBNote[]> {
  try {
    const store = await initObjectStore('readonly');
    const index: IDBIndex = store.index('order');

    return execute<IDBNote[]>(index.getAll());
  } catch (error) {
    logError(error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
}

export async function get(id: number): Promise<IDBNote> {
  try {
    const store = await initObjectStore('readonly');

    return execute<IDBNote>(store.get(id));
  } catch (error) {
    logError((error.target as IDBRequest).error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
}

export async function add(item: IDBNote): Promise<number> {
  try {
    const store = await initObjectStore('readwrite');

    return execute<number>(store.add({ ...item, id: (!item.id || item.id < 1) ? generateId() : item.id }));
  } catch (error) {
    logError(error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
}

export async function update(item: IDBNote, objectStore?: IDBObjectStore): Promise<void> {
  try {
    const store = objectStore || await initObjectStore('readwrite');

    return execute<void>(store.put(item));
  } catch (error) {
    logError(error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
}

export async function remove(item: (IDBNote | number), objectStore?: IDBObjectStore): Promise<void> {
  try {
    const store = objectStore || await initObjectStore('readwrite');

    return execute<void>(store.delete(typeof(item) === 'number' ? item : item.id));
  } catch (error) {
    logError(error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
}

export async function clear(): Promise<void> {
  try {
    const store = await initObjectStore('readwrite');

    return execute<void>(store.clear());
  } catch (error) {
    logError(error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
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

    while (__queueList.length) {
      const { item, type } = __queueList.shift();

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
