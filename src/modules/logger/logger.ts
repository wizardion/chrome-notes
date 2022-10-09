import {ILog,ILogType,ILogColor,ILogColors} from './interfaces';

var __database: IDBDatabase;

function logError(e: (Error|Event|any)) {
  console.error('DB ERROR', e.stack || e.message || e.cause || e, e.target);
}

function upgradeNeeded(db:IDBDatabase, request:IDBOpenDBRequest) {
  var objectStore:IDBObjectStore = null;

  if (!db.objectStoreNames.contains('logs')) {
    objectStore = db.createObjectStore('logs', {autoIncrement : true, keyPath: 'id'});
  } else {
    objectStore = request.transaction.objectStore('logs');
  }
}

function initDB(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!__database) {
      var request = indexedDB.open('MyLogs', 1);
  
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
      var db = await initDB();
      var transaction:IDBTransaction = db.transaction('logs', mode);

      transaction.onerror = reject;
      resolve(transaction.objectStore('logs'));
    } catch (er) {
      reject(er);
    }
  });
}

function put(type: ILogType, color: string, name: string, args: any[]): Promise<number> {
  return new Promise<number>(async (resolve, reject) => {
    try {
      var store:IDBObjectStore = await initObjectStore('readwrite');
      var request: IDBRequest = store.add({
        time: new Date().getTime(), 
        type: type, 
        color: color, 
        name: name, 
        data: (args && args[0] !== '' && args[0] !== null)? JSON.stringify(args) : null
      });

      request.onsuccess = (e: Event) => resolve(<number>(e.target as IDBRequest).result);
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

export class Logger {
  private name: string;
  private color: ILogColor;

  constructor(name: string, color?: ILogColors) {
    this.name = name;
    this.color = ILogColor[color];
  }

  public info(...args: any[]): Promise<number> {
    return put(ILogType.Info, this.color, this.name, args);
  }

  public static info(...args: any[]): Promise<number> {
    return put(ILogType.Info, null, null, args);
  }

  public warn(...args: any[]): Promise<number> {
    return put(ILogType.Warning, this.color, this.name, args);
  }

  public static warn(...args: any[]): Promise<number> {
    return put(ILogType.Warning, null, null, args);
  }

  public error(...args: any[]): Promise<number> {
    return put(ILogType.Error, this.color, this.name, args);
  }

  public static error(...args: any[]): Promise<number> {
    return put(ILogType.Error, null, null, args);
  }

  public clear(): Promise<void> {
    return Logger.clear();
  }

  public static clear(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        var store:IDBObjectStore = await initObjectStore('readwrite');
        var request: IDBRequest = store.clear();
  
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

  public addLine(): Promise<number> {
    return put(ILogType.Info, null, this.name, null);
  }

  public static load(): Promise<ILog[]> {
    return new Promise<ILog[]>(async (resolve, reject) => {
      try {
        var store:IDBObjectStore = await initObjectStore('readonly');
        var request: IDBRequest = store.getAll();
    
        request.onsuccess = (e: Event) => {
          let logs: ILog[] = <ILog[]>(e.target as IDBRequest).result;
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

    if (log.type === ILogType.Info) {
      console.log.apply(console, [].concat(
        log.color || [], 
        `[${new Date(log.time).toLocaleString()}][${log.name}] - `,
        JSON.parse(log.data)
      ));
    }

    if (log.type === ILogType.Warning) {
      console.log(
        `%c[${new Date(log.time).toLocaleString()}][${log.name}] - ` +
        `%c:${JSON.parse(log.data).join('; ')}`,
        'color: #ff8500;', 'color: #ffa500;',
      );
    }

    if (log.type === ILogType.Error) {
      console.log(
        `%c[${new Date(log.time).toLocaleString()}][${log.name}] - ` +
        `%c:${JSON.parse(log.data).join('; ')}`,
        'color: #ff5500;', 'color: #ff0000;',
      );
    }
  }
}