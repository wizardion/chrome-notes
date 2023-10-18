import { ILog, ILogLevel, ILogColor, ILogColors, logLevel } from './logger.models';


let __database: IDBDatabase;
let __tracing: boolean;

function logError(e: (Error|Event|any)) {
  console.error('DB ERROR', e.stack || e.message || e.cause || e, e.target);
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
  return new Promise<IDBObjectStore>(async (resolve, reject) => {
    try {
      const db = await initDB();
      const transaction:IDBTransaction = db.transaction('logs', mode);

      transaction.onerror = reject;
      resolve(transaction.objectStore('logs'));
    } catch (er) {
      reject(er);
    }
  });
}

function put(level: ILogLevel, color: string, name: string, args: any[]): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const store: IDBObjectStore = await initObjectStore('readwrite');
      const log: ILog = {
        time: new Date().getTime(),
        level: level,
        color: color,
        name: name,
        data: (args && args[0] !== '' && args[0] !== null) ? JSON.stringify(args) : null
      };

      if (__tracing) {
        Logger.print(log);
      }

      if (level >= logLevel) {
        const request: IDBRequest = store.add(log);

        request.onsuccess = () => resolve();

        request.onerror = (e: Event) => {
          logError(e);
          reject(e);
        };
      }
    } catch (error) {
      logError(error);
      reject(error);
    }
  });
}

export class Logger {
  private name: string;
  private color: ILogColor;

  constructor(name: string, color?: ILogColors) {
    this.name = name;
    this.color = ILogColor[color];
  }

  public static get tracing(): boolean {
    return __tracing;
  }

  public static set tracing(value: boolean) {
    __tracing = value;
  }

  public info(...args: any[]): Promise<void> {
    return put(ILogLevel.Info, this.color, this.name, args);
  }

  public warn(...args: any[]): Promise<void> {
    return put(ILogLevel.Warning, this.color, this.name, args);
  }

  public error(...args: any[]): Promise<void> {
    return put(ILogLevel.Error, this.color, this.name, args);
  }

  public clear(): Promise<void> {
    return Logger.clear();
  }

  public addLine(): Promise<void> {
    return put(ILogLevel.Info, null, this.name, null);
  }

  public static info(...args: any[]): Promise<void> {
    return put(ILogLevel.Info, null, null, args);
  }

  public static warn(...args: any[]): Promise<void> {
    return put(ILogLevel.Warning, null, null, args);
  }

  public static error(...args: any[]): Promise<void> {
    return put(ILogLevel.Error, null, null, args);
  }

  public static clear(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        const store:IDBObjectStore = await initObjectStore('readwrite');
        const request: IDBRequest = store.clear();

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

  public static load(): Promise<ILog[]> {
    return new Promise<ILog[]>(async (resolve, reject) => {
      try {
        const store:IDBObjectStore = await initObjectStore('readonly');
        const request: IDBRequest = store.getAll();

        request.onsuccess = (e: Event) => {
          const logs: ILog[] = <ILog[]>(e.target as IDBRequest).result;

          resolve(logs.sort((a, b) => a.time - b.time));
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

  public static print(log: ILog) {
    if (log.data === null) {
      console.log('');

      return;
    }

    if (log.level === ILogLevel.Info) {
      console.log.apply(console, [].concat(
        log.color || [],
        `[${new Date(log.time).toLocaleString()}][${log.name}] - `,
        JSON.parse(log.data)
      ));
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
}
