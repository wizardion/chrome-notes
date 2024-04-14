import * as core from 'core';
import { ISyncStorageValue, storage } from 'core/services';
// import {migrate} from 'modules/storage/migrate';
import { LoggerService } from 'modules/logger';
import { IdentityInfo } from 'modules/sync/components/models/sync.models';
import {
  DataWorker, SyncWorker, BaseWorker, StorageChange, onSyncInfoChanged,
  openPopup, ensureOptionPage, initPopup, onIdentityInfoChanged
} from './components';
import { ISettingsArea, ITabInfo } from 'modules/settings/models/settings.model';
import { CachedStorageService } from 'core/services/cached';
import { TerminateProcess } from './components/models/models';
import { getSettings } from 'modules/settings';


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
  const workers: (typeof BaseWorker)[] = [DataWorker, SyncWorker];
  const settings = await getSettings();

  for (let i = 0; i < workers.length; i++) {
    const Base = workers[i];

    if (alarm.name === Base.name) {
      const worker = new Base(settings);

      try {
        await worker.process();

        if (settings.error?.worker === worker.name) {
          settings.error = null;
          await storage.local.set('settings', settings);
        }
      } catch (error) {
        const message = error.message || String(error);

        await logger.warn('An error occurred during the process: ', message);
        settings.error = { message: `${message}`, worker: worker.name };

        if (error instanceof TerminateProcess) {
          await workers.find(i => i.name === error.worker)?.deregister();
          await storage.local.set('settings', settings);
          await ensureOptionPage();
        }
      }
    }
  }
});

chrome.action.onClicked.addListener(async () => {
  const local = await chrome.storage.local.get(['window', 'migrate', 'tabInfo', 'settings']);

  openPopup(local.settings?.value as ISettingsArea, local.tabInfo as ITabInfo);
});

chrome.storage.sync.onChanged.addListener(async (changes: StorageChange) => {
  if (changes.syncInfo) {
    const data = <ISyncStorageValue>changes.syncInfo.newValue;
    const id = await core.applicationId();

    if ((data && data.id !== id) || !data) {
      return await onSyncInfoChanged(await storage.sync.decrypt(data));
    }
  }
});

chrome.storage.local.onChanged.addListener(async (changes: StorageChange) => {
  if (changes.identityInfo) {
    const newInfo: IdentityInfo = <IdentityInfo> await core.decrypt(changes.identityInfo.newValue?.value);
    const oldInfo: IdentityInfo = <IdentityInfo> await core.decrypt(changes.identityInfo.oldValue?.value);

    return await onIdentityInfoChanged(oldInfo, newInfo);
  }
});
