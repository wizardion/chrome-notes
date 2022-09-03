/* import * as sync from './modules/db/sync_copy';
import {migrate} from './modules/storage/migrate';
import {generateKey} from './modules/db/encrypter_copy';

var _time_: number;

interface IWindow {
  top: number;
  left: number;
  width: number;
  height: number;
}

chrome.runtime.onInstalled.addListener(function() {
  console.log('app was installed');
  chrome.storage.local.clear().finally(() => {
    chrome.storage.sync.clear().finally(async() => {
      chrome.tabs.create({url: chrome.runtime.getURL('options.html')});
    });
  });
  // -----------------------------------------------------------------------------------------
  chrome.alarms.clearAll((alarm) => {});

  chrome.alarms.create('alert', {periodInMinutes: 1});
  // chrome.alarms.create('sync', {periodInMinutes: 0.35}); // 5 minutes.
  chrome.alarms.create('sync', {periodInMinutes: 15});

  chrome.storage.local.get(['mode', 'migrate', 'oldNotes', 'syncEnabled', 'internalKey', 'shareKey'], function(result) {
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
  });
});

chrome.runtime.onUpdateAvailable.addListener(() => {
  console.warn('update is available');
});

chrome.alarms.onAlarm.addListener((alarm:chrome.alarms.Alarm) => {
  _time_ = new Date().getTime();

  if (alarm.name === 'sync') {
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
  if (message === 'get-sync-notes') {
    sendResponse({working: sync.isBusy(), time: _time_});
  }
});

function eventOnStorageChanged(changes: {[key: string]: chrome.storage.StorageChange}, namespace: chrome.storage.AreaName) {
  if (namespace === 'local') {
    for (let [key, {oldValue, newValue}] of Object.entries(changes)) {
      if (key === 'mode' && oldValue !== newValue) {
        console.log('storage.onChanged.mode:', oldValue, newValue);
        setPopup(Number(newValue));
      }

      if (key === 'internalKey' && oldValue && newValue && oldValue !== newValue) {
        let busy = sync.isBusy();

        console.log('internalKey', {
          'oldValue': oldValue,
          'newValue': newValue,
        });

        if (busy) {
          busy.finally(() => sync.syncBack(oldValue, newValue));
        } else {
          sync.syncBack(oldValue, newValue);
        }
      }
    }
  }

  if (namespace === 'sync') {
    chrome.storage.local.get(['syncEnabled', 'internalKey', 'shareKey', 'lastSynced']).then((result) => {
      if (result.syncEnabled && result.internalKey) {
        let busy = sync.isBusy();

        if (busy) {
          busy.finally(() => sync.onChanged(changes, namespace));
        } else {
          sync.onChanged(changes, namespace);
        }
      }
    });
  }
}

function findTab(tabId: number, findback: Function, noneback?: Function) {
  chrome.tabs.query({}, function (tabs) {
    for(let i = 0; i < tabs.length; i++) {
      if (tabs[i].id === tabId) {
        return findback(tabs[i]);
      }
    }

    if (noneback) {
      noneback();
    }
  });
}

function startSync(): Promise<void> {
  var busy;
  console.log('1. start Sync...');

  if (!sync.isBusy()) {
    busy = sync.start();
  } else {
    console.log('... busy');
  }

  return busy;
}

function setPopup(mode: number) {
  if (mode === 3 || mode === 4) {
    chrome.action.setPopup({popup: ''}, ()=>{});
  } else {
    chrome.action.setPopup({popup: 'popup.html'}, ()=>{});
  }
}

function openPopup(mode: number, window?: IWindow, tabId?: number, windowId?: number) {
  if (tabId) {
    if (windowId) {
      chrome.windows.update(windowId, {focused: true});
    }

    return chrome.tabs.update(tabId, {active: true});
  }

  if (mode === 3) {
    return chrome.tabs.create({url: chrome.runtime.getURL('popup.html')});
  }

  if (mode === 4) {
    if (window) {
      chrome.windows.create({
        focused: true, url: chrome.runtime.getURL('popup.html'), type: 'popup',
        left: window.left,
        top: window.top,
        width: window.width,
        height: window.height,
      });
    } else {
      chrome.windows.create({focused: true, url: chrome.runtime.getURL('popup.html'), type: 'popup'});
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
 */