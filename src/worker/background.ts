import * as core from 'modules/core';
import storage from 'modules/storage/storage';
// import {migrate} from 'modules/storage/migrate';
import { Logger } from 'modules/logger/logger';
import { ISyncStorageValue } from 'modules/storage/interfaces';
import { IdentityInfo } from 'modules/sync/components/interfaces';
import {
  DataWorker, SyncWorker, BaseWorker, IWindow, StorageChange, AreaName, eventOnSyncInfoChanged,
  eventOnIdentityInfoChanged, findTab, openPopup, ensureOptionPage, initPopup
} from './components';
import { CachedStorage } from 'modules/storage/cached';
import { ISettingsArea } from 'modules/settings/settings.model';


const logger: Logger = new Logger('background.ts', 'green');

async function initApp(handler: string) {
  //#region testing
  const settings = <ISettingsArea> await storage.local.get('settings');

  if (settings) {
    settings.error = null;
  }

  await core.delay(100);
  Logger.tracing = true;
  await Logger.clear();
  await storage.local.set('settings', settings);
  ensureOptionPage();
  //#endregion

  await logger.addLine();
  await logger.info('initApp is fired: ', [handler]);

  await CachedStorage.init();
  await chrome.alarms.clearAll();

  if (await SyncWorker.validate()) {
    await SyncWorker.register();
  }

  DataWorker.register();
  await initPopup();
}

chrome.runtime.onInstalled.addListener(async () => initApp('onInstalled'));

chrome.runtime.onStartup.addListener(async () => initApp('onStartup'));

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
  const settings = <ISettingsArea> await storage.local.get('settings');
  const workers: (typeof BaseWorker)[] = [DataWorker, SyncWorker];

  settings.error = null;

  for (let i = 0; i < workers.length; i++) {
    const Base = workers[i];

    if (alarm.name === Base.worker) {
      const worker = new Base(settings);

      await logger.addLine();
      await logger.info(`${Base.worker} started`);

      try {
        await worker.process();
      } catch (error) {
        settings.error = { message: `Oops, something's wrong... ${error.message || String(error)}` };
        await logger.warn('An error occurred during the process: ', settings.error.message);
        await Base.deregister();
      } finally {
        await logger.info(`${Base.worker} finished`);
      }
    }
  }

  if (settings.error) {
    await storage.local.set('settings', settings);
    await ensureOptionPage();
  }
});

chrome.action.onClicked.addListener(async () => {
  const local = await chrome.storage.local.get(['window', 'migrate', 'tabInfo', 'settings']);
  const window: IWindow = local.window;

  // if (local.migrate) {
  //   return openMigration();
  // }

  if (local.tabInfo) {
    const tab: chrome.tabs.Tab = await findTab(local.tabInfo.id);

    openPopup(local.mode, window, tab && tab.id, tab && tab.windowId);
  } else {
    // console.log('');
    openPopup(local.settings.common.mode, window);
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
