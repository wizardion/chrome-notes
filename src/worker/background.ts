import * as core from 'modules/core';
import { Cloud } from 'modules/sync/cloud';
import { removeCachedAuthToken } from 'modules/sync/components/drive';
// import {migrate} from 'modules/storage/migrate';
import { Logger } from 'modules/logger/logger';
import storage from 'modules/storage/storage';
import { ISyncStorageValue } from 'modules/storage/interfaces';
import { IdentityInfo, ISyncInfo } from 'modules/sync/components/interfaces';
import { IWindow } from './interfaces';
import { AlarmWorker } from './components/alarm-worker';

type StorageChange = { [key: string]: chrome.storage.StorageChange };
type AreaName = chrome.storage.AreaName;
const workerName: string = 'sync-worker';
const logger: Logger = new Logger('background.ts', 'green');


chrome.runtime.onInstalled.addListener(async () => {
  await chrome.alarms.clearAll();
  if (await AlarmWorker.validate()) {
    await AlarmWorker.start();
  }

  await storage.cached.init();
  //#region testing
  await core.delay(100);
  Logger.tracing = true;
  // chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  //#endregion
});

chrome.runtime.onStartup.addListener(async () => {
  logger.info('onStartup is fired');
  await storage.cached.init();

  await chrome.alarms.clearAll();
  if (await AlarmWorker.validate()) {
    await AlarmWorker.start();
  }
});

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
  await logger.addLine();
  await logger.info(`${workerName} started`);

  if (alarm.name === workerName && !(await Cloud.busy())) {
    try {
      await chrome.storage.session.remove('errorMessage');
      await Cloud.sync();
    } catch (error) {
      await ensureOptionPage();
      await chrome.storage.session.set({ errorMessage: error.message });
      await logger.error('An error occurred during the sync process.\n', error.message);
      await AlarmWorker.stop();
    }
  } else if (await Cloud.busy()) {
    await logger.info(`${workerName} is busy`);
  }

  await logger.info(`${workerName} finished`);
});

chrome.action.onClicked.addListener(async () => {
  var local = await chrome.storage.local.get(['window', 'migrate', 'tabInfo']);
  let mode: number = <number>(await storage.cached.get(['mode'])).mode.value || 0;
  let window: IWindow = local.window;

  // if (local.migrate) {
  //   return openMigration();
  // }

  if (local.tabInfo) {
    var tab: chrome.tabs.Tab = await findTab(local.tabInfo.id);

    openPopup(mode, window, tab && tab.id, tab && tab.windowId);
  } else {
    openPopup(mode, window);
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
  }

  if (!identity.locked && info.enabled && info.token && info.encrypted && !identity.passphrase) {
    identity.locked = true;
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
    await AlarmWorker.stop();
    return await removeCachedAuthToken(oldInfo.token);
  }

  if (newInfo && newInfo.token && (await AlarmWorker.validate(newInfo))) {
    return await AlarmWorker.start();
  }

  if (newInfo && newInfo.locked) {
    await ensureOptionPage();
  }

  return await AlarmWorker.stop();
}

async function findTab(tabId: number): Promise<chrome.tabs.Tab> {
  var tabs = await chrome.tabs.query({});

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
    return chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
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
      chrome.windows.create({ focused: true, url: chrome.runtime.getURL('index.html'), type: 'popup' });
    }
  }
}

//#region testing
chrome.runtime.onSuspend.addListener(() => {
  logger.info('onSuspend called');
});

chrome.runtime.onSuspendCanceled.addListener(() => {
  logger.info('onSuspend is canceled');
});

chrome.runtime.onConnect.addListener(() => {
  logger.info('onConnect is fired');
});
//#endregion

//#region old.code
// function setPopup(mode: number) {
//   if (mode === 3 || mode === 4) {
//     chrome.action.setPopup({popup: ''}, ()=>{});
//   } else {
//     chrome.action.setPopup({popup: 'popup.html'}, ()=>{});
//   }
// }

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
