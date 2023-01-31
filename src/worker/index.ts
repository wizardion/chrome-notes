import * as sync from 'modules/sync/sync';
import {migrate} from 'modules/storage/migrate';
import {Logger} from 'modules/logger/logger';
import storage from 'modules/storage/storage';


type StorageChange = chrome.storage.StorageChange;
type AreaName = chrome.storage.AreaName;
const logger: Logger = new Logger('background.ts', 'green');
const __periodInMinutes: number = 3; //20;


async function TEraseData() {
  chrome.tabs.create({url: chrome.runtime.getURL('options.html')});
  await storage.cached.clear();
  logger.info('\t\t=> storage.cached: cleared!');
}

interface IWindow {
  top: number;
  left: number;
  width: number;
  height: number;
}

// chrome.runtime.onStartup.addListener(async () => {
//   await storage.cached.init();
//   logger.info('\t\t=> storage.cached: initiated!');
// });

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.clear('alert');
  chrome.alarms.create('alert', {periodInMinutes: 1});

  chrome.storage.local.remove('logs');

  logger.clear().then(() => {
    logger.info('\t\t=> app installed!');
  });

  chrome.storage.local.get(['migrate', 'oldNotes', 'syncEnabled', 'internalKey', 'shareKey', 'applicationId'], 
                            async function(result) {
    if (!result.applicationId) {
      sync.initApplication();
    }

    if (result.migrate && result.oldNotes) {
      await migrate(result.oldNotes);
      return chrome.storage.local.clear();
    }
    
    if (result.migrate) {
      chrome.action.setPopup({popup: ''}, ()=>{});
      await storage.cached.permanent('mode', 5);
      return chrome.tabs.create({url: chrome.runtime.getURL('migration.html')});
    }

    TEraseData();
    await chrome.storage.local.remove('syncProcessing');
    setPopup((await storage.cached.get('mode')).mode.value || 0);
    startSync();
  });
});

chrome.alarms.onAlarm.addListener(async (alarm:chrome.alarms.Alarm) => {
  if (alarm.name === 'sync') {
    let local = await chrome.storage.local.get(['syncProcessing']);

    if (local.syncProcessing) {
      let minutes: number = Math.round((((new Date().getTime() - local.syncProcessing) / 1000) / 60) * 100) / 100;

      if (minutes >= (__periodInMinutes * 2)) {
        await chrome.storage.local.remove('syncProcessing');
        await logger.warn('looks like last sync was terminated', minutes);
      }
    }

    await startSync();
  }

  if (alarm.name === 'alert') {
    let cache = await storage.cached.get('mode');
    setPopup(Number(cache.mode.value || 0));
  }
});

chrome.action.onClicked.addListener(async () => {
  var local = await chrome.storage.local.get(['window', 'migrate', 'tabInfo']);
  let mode: number = (await storage.cached.get('mode')).mode.value || 0;
  let window: IWindow = local.window;

  if (local.migrate) {
    return openMigration();
  }

  if (local.tabInfo) {
    var tab: chrome.tabs.Tab = await findTab(local.tabInfo.id);

    openPopup(mode, window, tab && tab.id, tab && tab.windowId);
  } else {
    openPopup(mode, window);
  }
});

chrome.storage.onChanged.addListener((changes: {[key: string]: StorageChange}, namespace: AreaName) => {
  if (namespace === 'sync' && changes.message && changes.message.newValue) {
    sync.onMessage(changes.message.newValue).catch(logError);
  }
});

async function logError(e: Error) {
  // console.log('background:e', e);
  // console.trace('background:e', e.stack);
  // console.log('background:e', {'v': e.stack.toString()});
  // console.log('-------------------------------------------------------------');
  // @ts-ignoree
  await logger.error('Background ERROR', e.stack || e.message || e.cause || e, e.target);
  // await logger.error('Background ERROR', e.stack);
}

function setPopup(mode: number) {
  if (mode === 3 || mode === 4) {
    chrome.action.setPopup({popup: ''}, ()=>{});
  } else {
    chrome.action.setPopup({popup: 'popup.html'}, ()=>{});
  }
}

async function findTab(tabId: number): Promise<chrome.tabs.Tab> {
  var tabs = await chrome.tabs.query({});

  for(let i = 0; i < tabs.length; i++) {
    if (tabs[i].id === tabId) {
      return tabs[i];
    }
  }

  return null;
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

async function startSync() {
  try {
    await logger.addLine();
    await logger.info('=>=>=> start Sync... lastError: ', chrome.runtime.lastError);
    var busy: boolean = await sync.isBusy();

    if (!busy) {
      await sync.start();
      await logger.info('=>=>=> Sync is completed, bytes: ', 
                        await chrome.storage.sync.getBytesInUse(), chrome.storage.sync.QUOTA_BYTES, '!');
    } else {
      await logger.info('... busy');
    }
  } catch (error) {
    await logError(error);
  }
}
