import { ILog, ILogLevel, logLevel } from './models/logger.models';


let __database: IDBDatabase;

enum ERROR_MESSAGES {
  initiate= 'Failed to initiate the Logger.'
}

export const loggerConfigs = {
  tracing: false
};

function logError(e: (Error|Event|any)) {
  console.error('DB ERROR', e.stack || e.message || e.cause || e, e.target);
}

export function print(log: ILog) {
  if (log.data === null) {
    console.log('');

    return;
  }

  if (log.level === ILogLevel.Info) {
    console.log(
      log.color || [],
      `[${new Date(log.time).toLocaleString()}][${log.name}] - `,
      JSON.parse(log.data)
    );
  }

  if (log.level === ILogLevel.Warning) {
    console.log(
      `%c[${new Date(log.time).toLocaleString()}][${log.name}] - ` +
        `%c:${JSON.parse(log.data).join('; ')}`,
      'color: #ff8500;', 'color: #ffa500;',
    );
  }

  if (log.level === ILogLevel.Error) {
    console.log(
      `%c[${new Date(log.time).toLocaleString()}][${log.name}] - ` +
        `%c:${JSON.parse(log.data).join('; ')}`,
      'color: #ff5500;', 'color: #ff0000;',
    );
  }
}

function upgradeNeeded(db:IDBDatabase, request:IDBOpenDBRequest) {
  let objectStore:IDBObjectStore = null;

  if (!db.objectStoreNames.contains('logs')) {
    objectStore = db.createObjectStore('logs', { autoIncrement: true, keyPath: 'id' });
  } else {
    objectStore = request.transaction.objectStore('logs');
  }

  if (objectStore.indexNames.contains('level')) {
    objectStore.deleteIndex('level');
  }

  if (!objectStore.indexNames.contains('level')) {
    objectStore.createIndex('level', 'level', { unique: false });
  }
}

function initDB(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!__database) {
      const request = indexedDB.open('MyLogs', 3);

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
    }

    resolve(__database);
  });
}

function initObjectStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
  return new Promise<IDBObjectStore>((resolve, reject) => {
    initDB().then((db) => {
      const transaction:IDBTransaction = db.transaction('logs', mode);

      transaction.onerror = reject;
      resolve(transaction.objectStore('logs'));
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

export async function load(): Promise<ILog[]> {
  try {
    const store = await initObjectStore('readonly');

    return (await execute<ILog[]>(store.getAll()));
  } catch (error) {
    logError(error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
}

export async function remove(id: number): Promise<void> {
  try {
    const store = await initObjectStore('readwrite');

    return (await execute<void>(store.delete(id)));
  } catch (error) {
    logError(error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
}

export async function clear(): Promise<void> {
  try {
    const store = await initObjectStore('readwrite');

    return (await execute<void>(store.clear()));
  } catch (error) {
    logError(error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
}

export async function logInfo(level: ILogLevel, color: string, name: string, args: any[]): Promise<void> {
  try {
    const store = await initObjectStore('readwrite');
    const log: ILog = {
      time: new Date().getTime(),
      level: level,
      color: color,
      name: name,
      data: (args && args[0] !== '' && args[0] !== null) ? JSON.stringify(args) : null
    };

    if (loggerConfigs.tracing) {
      print(log);
    }

    if (level >= logLevel) {
      return execute<void>(store.add(log));
    }
  } catch (error) {
    logError(error);
    throw new Error(ERROR_MESSAGES.initiate);
  }
}
