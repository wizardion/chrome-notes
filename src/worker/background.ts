import * as core from 'core';
import { ISyncStorageValue, storage } from 'core/services';
// import {migrate} from 'modules/storage/migrate';
import { LoggerService } from 'modules/logger';
import { IdentityInfo } from 'modules/sync/components/models/sync.models';
import {
  DataWorker, SyncWorker, BaseWorker, StorageChange, AreaName, eventOnSyncInfoChanged,
  openPopup, ensureOptionPage, initPopup, eventOnIdentityInfoChanged
} from './components';
import { ISettingsArea, ITabInfo } from 'modules/settings/models/settings.model';
import { CachedStorageService } from 'core/services/cached';
import { TerminateProcess } from './components/models/models';


const logger = new LoggerService('background.ts', 'green');

async function initApp(handler: string) {
  //#region testing
  const settings = <ISettingsArea> await storage.local.get('settings');

  if (settings) {
    settings.error = null;
  }

  await core.delay(100);
  LoggerService.tracing = true;
  await LoggerService.clear();
  await storage.local.set('settings', settings);
  ensureOptionPage();
  //#endregion

  await logger.addLine();
  await logger.info('initApp is fired: ', handler);

  // TODO restore all sessions.
  await CachedStorageService.init();
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

      try {
        await worker.process();
      } catch (error) {
        const message = error.message || String(error);

        settings.error = { message: `Oops, something's wrong... ${message}` };
        await logger.warn('An error occurred during the process: ', message);

        if (error instanceof TerminateProcess) {
          workers.find(i => i.worker === error.worker)?.deregister();
          await ensureOptionPage();
        }
      }
    }
  }

  await storage.local.set('settings', settings);
});

chrome.action.onClicked.addListener(async () => {
  const local = await chrome.storage.local.get(['window', 'migrate', 'tabInfo', 'settings']);

  openPopup(local.settings?.value as ISettingsArea, local.tabInfo as ITabInfo);
});

chrome.storage.onChanged.addListener(async (changes: StorageChange, namespace: AreaName) => {
  if (namespace === 'sync' && changes.syncInfo) {
    const data = <ISyncStorageValue>changes.syncInfo.newValue;
    const id = await core.applicationId();

    if ((data && data.id !== id) || !data) {
      const info = await storage.sync.decrypt(data);

      await logger.info('syncInfo.changed', { info });

      return await eventOnSyncInfoChanged(await storage.sync.decrypt(data));
    }
  }

  if (namespace === 'local' && changes.identityInfo) {
    const newInfo: IdentityInfo = <IdentityInfo> await core.decrypt(changes.identityInfo.newValue?.value);
    const oldInfo: IdentityInfo = <IdentityInfo> await core.decrypt(changes.identityInfo.oldValue?.value);

    await logger.info('identityInfo.changed', { newInfo, oldInfo });

    return await eventOnIdentityInfoChanged(oldInfo, newInfo);
  }
});
