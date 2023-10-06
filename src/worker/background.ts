import * as core from 'modules/core';
import { Cloud } from 'modules/sync/cloud';
import { removeCachedAuthToken } from 'modules/sync/components/drive';
// import {migrate} from 'modules/storage/migrate';
import { Logger } from 'modules/logger/logger';
import storage from 'modules/storage/storage';
import { ISyncStorageValue } from 'modules/storage/interfaces';
import { IdentityInfo, ISyncInfo } from 'modules/sync/components/interfaces';
import { workers, DataWorker, SyncWorker, IWindow, StorageChange, AreaName } from './components';


const logger: Logger = new Logger('background.ts', 'green');

chrome.runtime.onInstalled.addListener(async () => await initApp('onInstalled'));

chrome.runtime.onStartup.addListener(async () => await initApp('onStartup'));

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
  const workers = [DataWorker, SyncWorker];
  
  for (let i = 0; i < workers.length; i++) {
    const worker = workers[i];
    
    if (alarm.name === worker.worker) {
      await logger.addLine();
      await logger.info(`${worker.worker} started`);

      try {
        await chrome.storage.session.remove('errorMessage');
        await worker.process();
      } catch (error) {
        await ensureOptionPage();
        await chrome.storage.session.set({ errorMessage: error.message });
        await logger.error('An error occurred during the process.\n', error.message);
        await worker.stop();
      } finally {
        await logger.info(`${worker.worker} finished`);
      }
    }
  }
});

chrome.action.onClicked.addListener(async () => {
  const local = await chrome.storage.local.get(['window', 'migrate', 'tabInfo', 'mode']);
  const window: IWindow = local.window;

  // if (local.migrate) {
  //   return openMigration();
  // }

  if (local.tabInfo) {
    const tab: chrome.tabs.Tab = await findTab(local.tabInfo.id);
    openPopup(local.mode, window, tab && tab.id, tab && tab.windowId);
  } else {
    openPopup(local.mode, window);
  }
});

chrome.storage.onChanged.addListener(async (changes: StorageChange, namespace: AreaName) => {
  if (namespace === 'sync' && changes.syncInfo) {
    const data = <ISyncStorageValue>changes.syncInfo.newValue;
    const id = await core.applicationId();

    if ((data && data.id !== id) || !data) {
      console.log('storage.syncInfo.onChanged.data', { v: data });
      return await eventOnSyncInfoChanged(await storage.sync.decrypt(data));
    }
  }

  if (namespace === 'local' && changes.identityInfo) {
    const newInfo: IdentityInfo = <IdentityInfo>await storage.local.decrypt(changes.identityInfo.newValue);
    const oldInfo: IdentityInfo = <IdentityInfo>await storage.local.decrypt(changes.identityInfo.oldValue);

    return await eventOnIdentityInfoChanged(oldInfo, newInfo);
  }
});

async function initApp(handler: string) {
  await logger.info('initApp is fired: ', [handler]);

  await chrome.alarms.clearAll();
  if (await SyncWorker.validate()) {
    await SyncWorker.start();
  }

  DataWorker.start();
  await initPopup();

  //#region testing
  await core.delay(100);
  Logger.tracing = true;
  ensureOptionPage();
  //#endregion
}

async function initPopup() {
  const storage = await chrome.storage.local.get('mode');

  if (storage.mode === 3 || storage.mode === 4) {
    chrome.action.setPopup({ popup: '' });
  } else {
    chrome.action.setPopup({ popup: 'popup.html' });
  }
}

async function eventOnSyncInfoChanged(info: ISyncInfo) {
  logger.info('eventOnSyncInfoChanged', { i: info });
  const identity: IdentityInfo = <IdentityInfo>await storage.local.get('identityInfo') || {
    id: null,
    enabled: false,
    token: null,
    passphrase: null,
    encrypted: false,
  };

  if (identity.locked && info.enabled && info.token && !info.encrypted && identity.encrypted) {
    identity.locked = false;
    await storage.cached.permanent('locked', false);
  }

  if (!identity.locked && info.enabled && info.token && info.encrypted && !identity.passphrase) {
    identity.locked = true;
    await storage.cached.permanent('locked', true);
  }

  if (!info.encrypted) {
    identity.passphrase = null;
  }

  identity.enabled = info.enabled;
  identity.encrypted = info.encrypted;
  identity.token = info.token;

  await storage.local.sensitive('identityInfo', identity);
}

async function eventOnIdentityInfoChanged(oldInfo: IdentityInfo, newInfo: IdentityInfo) {
  logger.info('eventOnIdentityInfoChanged', { i: newInfo });

  if (oldInfo && oldInfo.token && (!newInfo || !newInfo.token)) {
    await SyncWorker.stop();
    return await removeCachedAuthToken(oldInfo.token);
  }

  if (newInfo && newInfo.token && (await SyncWorker.validate(newInfo))) {
    return await SyncWorker.start();
  }

  if (newInfo && newInfo.locked) {
    await ensureOptionPage();
  }

  return await SyncWorker.stop();
}

async function findTab(tabId: number): Promise<chrome.tabs.Tab> {
  const tabs = await chrome.tabs.query({});

  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].id === tabId) {
      return tabs[i];
    }
  }

  return null;
}

async function ensureOptionPage() {
  const data = await chrome.storage.session.get('optionPageId');

  if (data && data.optionPageId) {
    const tab = await findTab(<number>data.optionPageId);

    if (tab) {
      return chrome.tabs.update(tab.id, { active: true });
    }
  }

  return chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
}

function openPopup(mode: number, window?: IWindow, tabId?: number, windowId?: number) {
  if (tabId) {
    if (windowId) {
      chrome.windows.update(windowId, { focused: true });
    }

    return chrome.tabs.update(tabId, { active: true });
  }

  if (mode === 3) {
    return chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  }

  if (mode === 4) {
    if (window) {
      chrome.windows.create({
        focused: true,
        url: chrome.runtime.getURL('index.html'),
        type: 'popup',
        left: window.left,
        top: window.top,
        width: window.width,
        height: window.height,
      });
    } else {
      chrome.windows.create({ focused: true, url: chrome.runtime.getURL('popup.html'), type: 'popup' });
    }
  }
}

//#region testing
chrome.runtime.onSuspend.addListener(async () => {
  await logger.info('onSuspend called');
});

chrome.runtime.onSuspendCanceled.addListener(async () => {
  await logger.info('onSuspend is canceled');
});

chrome.runtime.onConnect.addListener(async () => {
  await logger.info('onConnect is fired');
});
//#endregion

//#region old.code
// chrome.runtime.onInstalled.addListener(() => {

//   chrome.storage.local.remove('logs');

//   logger.clear().then(() => {
//     logger.info('\t\t=> app installed!');
//   });

//   chrome.storage.local.get(['migrate', 'oldNotes', 'syncEnabled', 'internalKey', 'shareKey', 'applicationId'],
//                             async function(result) {
//     if (!result.applicationId) {
//       sync.initApplication();
//     }

//     if (result.migrate && result.oldNotes) {
//       await migrate(result.oldNotes);
//       return chrome.storage.local.clear();
//     }

//     if (result.migrate) {
//       chrome.action.setPopup({popup: ''}, ()=>{});
//       await storage.cached.permanent('mode', 5);
//       return chrome.tabs.create({url: chrome.runtime.getURL('migration.html')});
//     }

//     TEraseData();
//     await chrome.storage.local.remove('syncProcessing');
//     setPopup((await storage.cached.get(['mode'])).mode.value || 0);
//     startSync();
//   });
// });

// function openMigration() {
//   var url = chrome.runtime.getURL('migration.html');

//   chrome.tabs.query({url: url, currentWindow: true}, function (tabs) {
//     if (tabs.length) {
//       let tab = tabs[0];

//       chrome.tabs.update(tab.id, {active: true});
//     } else {
//       chrome.tabs.query({url: url}, function (allTabs) {
//         if (tabs.length) {
//           let tab = allTabs[0];

//           if (tab.windowId) {
//             chrome.windows.update(tab.windowId, {focused: true});
//           }

//           chrome.tabs.update(tab.id, {active: true});
//         } else {
//           chrome.tabs.create({url: url});
//         }
//       });
//     }
//   });
// }

// async function startSync() {
//   try {
//     await logger.addLine();
//     await logger.info('=>=>=> start Sync... lastError: ', chrome.runtime.lastError);
//     var busy: boolean = await sync.isBusy();

//     if (!busy) {
//       await sync.start();
//       await logger.info('=>=>=> Sync is completed, bytes: ',
//                         await chrome.storage.sync.getBytesInUse(), chrome.storage.sync.QUOTA_BYTES, '!');
//     } else {
//       await logger.info('... busy');
//     }
//   } catch (error) {
//     await logError(error);
//   }
// }
//#endregion
