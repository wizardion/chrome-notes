import * as sync from './modules/sync/sync';
import {migrate} from './modules/storage/migrate';
import idb from './modules/db/idb';
import { IDBNote } from './modules/db/interfaces';


const __periodInMinutes: number = 20;
const colors = {
  RED: '\x1b[31m%s\x1b[0m',
  GREEN: '\x1b[32m%s\x1b[0m',
  BLUE: '\x1b[34m%s\x1b[0m',
};

function TEraseData() {
  chrome.storage.local.clear().finally(() => {
    chrome.storage.sync.clear().finally(async() => {
      idb.load((data: IDBNote[]) => {
        for (let i = 0; i < data.length; i++) {
          const element = data[i];

          element.locked = false;
          element.inCloud = false;
          idb.update(element); 
        }
        
        chrome.tabs.create({url: chrome.runtime.getURL('options.html')});
      });
    });
  });
}

var rootLogs: any = null;
async function log(...args: any[]) {
  let local = await chrome.storage.local.get(['logs']);

  if (!rootLogs) {
    rootLogs = local;
  }

  if (!local.logs) {
    local.logs = [];
  }

  local.logs.push(args);
  await chrome.storage.local.set({logs: local.logs});
}

interface IWindow {
  top: number;
  left: number;
  width: number;
  height: number;
}

var _time_: number;

chrome.runtime.onInstalled.addListener(() => {
  TEraseData();
  chrome.alarms.clearAll();
  chrome.alarms.create('alert', {periodInMinutes: 1});
  chrome.alarms.create('sync', {periodInMinutes: __periodInMinutes});
  chrome.storage.local.set({logs: [[colors.GREEN, '\t\t=> app installed!']]});

  chrome.storage.local.get(['mode', 'migrate', 'oldNotes', 'syncEnabled', 'internalKey', 'shareKey', 'appId'], function(result) {
    if (!result.appId) {
      sync.initApp();
    }

    if (result.migrate && result.oldNotes) {
      migrate(result.oldNotes);
      return chrome.storage.local.clear();
    }
    
    if (result.migrate) {
      chrome.action.setPopup({popup: ''}, ()=>{});
      chrome.storage.local.set({mode: 4});
      return chrome.tabs.create({url: chrome.runtime.getURL('migration.html')});
    }

    setPopup(Number(result.mode));
    chrome.storage.onChanged.addListener(eventOnStorageChanged);
    startSync();
  });
});

chrome.alarms.onAlarm.addListener(async (alarm:chrome.alarms.Alarm) => {
  _time_ = new Date().getTime();

  if (alarm.name === 'sync') {
    let local = await chrome.storage.local.get(['syncProcessing']);

    if (local.syncProcessing) {
      let minutes: number = Math.round((((new Date().getTime() - local.syncProcessing) / 1000) / 60) * 100) / 100;

      if (minutes >= (__periodInMinutes * 2)) {
        await chrome.storage.local.remove('syncProcessing');
      }
    }

    return startSync();
  }

  chrome.storage.local.get(['mode'], function(result) {
    setPopup(Number(result.mode));
  });
});

chrome.action.onClicked.addListener(() => {
  chrome.storage.local.get(['mode', 'window', 'migrate', 'tabInfo'], function(result) {
    let mode: number = Number(result.mode);
    let window: IWindow = result.window;

    if (result.migrate) {
      return openMigration();
    }

    if (result.tabInfo) {
      findTab(result.tabInfo.id, (tab: chrome.tabs.Tab) => {
        openPopup(mode, window, tab.id, tab.windowId);
      }, () => {
        openPopup(mode, window);
      });
    } else {
      openPopup(mode, window);
    }
  });
});

chrome.runtime.onMessage.addListener((message: string, sender: any, sendResponse: (response?: any) => void) => {
  if (message === 'get-sync-status') {
    sendResponse({status2: sync.wait()});
  }
});

chrome.runtime.onConnect.addListener(() => {
  log(colors.RED, 'onConnect');
});

chrome.runtime.onStartup.addListener(() => {
  log(colors.RED, 'onStartup');
});

chrome.runtime.onSuspend.addListener(() => {
  log(colors.RED, 'onSuspend');
});

chrome.runtime.onSuspendCanceled.addListener(() => {
  log(colors.RED, 'onSuspendCanceled');
});

chrome.runtime.onSuspend.addListener(() => {
  log("Unloading.");
  // chrome.browserAction.setBadgeText({text: ""});
});


function eventOnStorageChanged(changes: {[key: string]: chrome.storage.StorageChange}, namespace: chrome.storage.AreaName) {
  if (namespace === 'local') {
    for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
      if (key === 'mode' && oldValue !== newValue) {
        log('storage.onChanged.mode:', oldValue, newValue);
        setPopup(Number(newValue));
      }

      // if (1) {
      //   log('\t:::key', key);
      //   // 
      // }

      if (key === 'internalKey' && oldValue && newValue && oldValue !== newValue) {
        let promise: Promise<void> = sync.wait();

        promise.finally(() => {
          sync.resync(oldValue, newValue);
        });
      }
    }
  }

  if (namespace === 'sync') {
    sync.onStorageChanged(changes, namespace);
  }
}

function setPopup(mode: number) {
  if (mode === 3 || mode === 4) {
    chrome.action.setPopup({popup: ''}, ()=>{});
  } else {
    chrome.action.setPopup({popup: 'popup.html'}, ()=>{});
  }
}

function findTab(tabId: number, found: Function, defaults?: Function) {
  chrome.tabs.query({}, function (tabs) {
    for(let i = 0; i < tabs.length; i++) {
      if (tabs[i].id === tabId) {
        return found(tabs[i]);
      }
    }

    if (defaults) {
      defaults();
    }
  });
}

function openPopup(mode: number, window?: IWindow, tabId?: number, windowId?: number) {
  if (tabId) {
    if (windowId) {
      chrome.windows.update(windowId, {focused: true});
    }

    return chrome.tabs.update(tabId, {active: true});
  }

  if (mode === 3) {
    return chrome.tabs.create({url: chrome.runtime.getURL('index.html')});
  }

  if (mode === 4) {
    if (window) {
      chrome.windows.create({
        focused: true, url: chrome.runtime.getURL('index.html'), type: 'popup',
        left: window.left,
        top: window.top,
        width: window.width,
        height: window.height,
      });
    } else {
      chrome.windows.create({focused: true, url: chrome.runtime.getURL('index.html'), type: 'popup'});
    }
  }
}

function openMigration() {
  var url = chrome.runtime.getURL('migration.html');

  chrome.tabs.query({url: url, currentWindow: true}, function (tabs) {
    if (tabs.length) {
      let tab = tabs[0];
      
      chrome.tabs.update(tab.id, {active: true});
    } else {
      chrome.tabs.query({url: url}, function (allTabs) {
        if (tabs.length) {
          let tab = allTabs[0];

          if (tab.windowId) {
            chrome.windows.update(tab.windowId, {focused: true});
          }
      
          chrome.tabs.update(tab.id, {active: true});
        } else {
          chrome.tabs.create({url: url});
        }
      });
    }
  });
}

function startSync(): Promise<void> {
  log(colors.GREEN, '=>=>=> start Sync... lastError: ', chrome.runtime.lastError);

  sync.isBusy().then((busy: boolean) => {

    if (!busy) {
      sync.start().finally(() => {
        chrome.storage.sync.getBytesInUse().then((bytes: number) => {
          log('bytes: ', bytes, chrome.storage.sync.QUOTA_BYTES);
          log(colors.GREEN, '=>=>=> Sync is completed!');
        });
      });
    } else {
      log(colors.GREEN, '... busy');
    }
  });

  return Promise.resolve();
}
