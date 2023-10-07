import * as core from 'modules/core';
import storage from 'modules/storage/storage';
// import {migrate} from 'modules/storage/migrate';
import { Logger } from 'modules/logger/logger';
import { ISyncStorageValue } from 'modules/storage/interfaces';
import { IdentityInfo } from 'modules/sync/components/interfaces';
import {
  DataWorker, SyncWorker, IWindow, StorageChange, AreaName, initApp, eventOnSyncInfoChanged,
  eventOnIdentityInfoChanged, findTab, openPopup, ensureOptionPage
} from './components';
import { ISettingsArea } from 'pages/options/components/options.model';


const logger: Logger = new Logger('background.ts', 'green');

chrome.runtime.onInstalled.addListener(async () => initApp('onInstalled'));

chrome.runtime.onStartup.addListener(async () => initApp('onStartup'));

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
  const workers = [DataWorker, SyncWorker];

  for (let i = 0; i < workers.length; i++) {
    const worker = workers[i];

    if (alarm.name === worker.worker) {
      const settings = <ISettingsArea> await storage.local.get('settings');

      await logger.addLine();
      await logger.info(`${worker.worker} started`);
      settings.error = null;

      try {
        await worker.process();
        await storage.local.set('settings', settings);
      } catch (error) {
        settings.error = { message: error.message };

        await storage.local.set('settings', settings);
        await logger.error('An error occurred during the process.\n', error.message);
        await worker.stop();
        await ensureOptionPage();
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
    const newInfo: IdentityInfo = <IdentityInfo> await storage.local.decrypt(changes.identityInfo.newValue);
    const oldInfo: IdentityInfo = <IdentityInfo> await storage.local.decrypt(changes.identityInfo.oldValue);

    return await eventOnIdentityInfoChanged(oldInfo, newInfo);
  }
});


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
