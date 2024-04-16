import { SyncWorker } from './sync-worker';
import { IdentityInfo } from 'modules/sync/components/models/sync.models';
import { storage, ISyncInfo } from 'core/services';
import { ISettingsArea, PAGE_MODES, getPopupPage, getSettings } from 'modules/settings';
import { ITabInfo } from 'modules/settings/models/settings.model';
import { applicationId } from 'core/index';
import { TerminateProcess } from './models/models';
import { BaseWorker } from './base-worker';
import { DataWorker } from './data-worker';
import { LoggerService } from 'modules/logger';
import { CachedStorageService } from 'core/services/cached';
import * as core from 'core';


export { StorageChange } from './models/models';


const logger = new LoggerService('background.ts', 'green');


export async function findTab(tabId: number): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({});

  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].id === tabId) {
      return tabs[i];
    }
  }

  return null;
}

export async function ensureOptionPage() {
  const data = await chrome.storage.session.get('optionPageId');

  if (data && data.optionPageId) {
    const tab = await findTab(<number>data.optionPageId);

    if (tab) {
      return chrome.tabs.update(tab.id, { active: true });
    }
  }

  return chrome.tabs.create({ url: chrome.runtime.getURL('options.html') + '?develop=true' });
}

export async function initPopup() {
  const settings = await getSettings();

  await chrome.action.setPopup({ popup: getPopupPage(settings.common) });
}

// export function openPopup(index: number, editor: number, window?: IWindow, tabId?: number, windowId?: number) {
export async function openPopup(settings: ISettingsArea, tabInfo?: ITabInfo) {
  const mode = PAGE_MODES[settings.common.mode];

  if (tabInfo) {
    const tab = await findTab(tabInfo.id);

    if (tab) {
      await chrome.windows.update(tab.windowId, { focused: true });

      return chrome.tabs.update(tab.id, { active: true });
    }
  }

  return chrome.tabs.create({ url: mode.page || 'option.html' });

  // if (mode === 0) {
  //   return chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  // }

  // if (mode === 3) {
  //   return chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  // }

  // if (mode === 4) {
  //   if (window) {
  //     chrome.windows.create({
  //       focused: true,
  //       url: chrome.runtime.getURL('index.html'),
  //       type: 'popup',
  //       left: window.left,
  //       top: window.top,
  //       width: window.width,
  //       height: window.height,
  //     });
  //   } else {
  //     chrome.windows.create({ focused: true, url: chrome.runtime.getURL('popup.html'), type: 'popup' });
  //   }
  // }
}

export async function startServiceWorker(alarm: chrome.alarms.Alarm) {
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
}

export async function initApplication(handler: string) {
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

export async function onSyncInfoChanged(info: ISyncInfo) {
  const identity = await storage.local.get<IdentityInfo>('identityInfo') || {
    fileId: null,
    enabled: false,
    token: null,
    passphrase: null,
    encrypted: false,
    applicationId: null
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
  identity.applicationId = info.applicationId;
  identity.encrypted = info.encrypted;
  identity.token = info.token;

  console.log('- onSyncInfoChanged.processed', { identity, info });

  await storage.local.sensitive('identityInfo', identity);
}

export async function onIdentityInfoChanged(oldInfo: IdentityInfo, newInfo: IdentityInfo) {
  console.log('- onIdentityInfoChanged', { oldInfo, newInfo });

  if (oldInfo && oldInfo.token && (!newInfo || !newInfo.token)) {
    await SyncWorker.deregister();

    console.log('- onIdentityInfoChanged.deregister.removeCache');

    return SyncWorker.removeCache(oldInfo.token);
  }

  if (newInfo && newInfo.token && (await SyncWorker.validate(newInfo))) {
    if (!oldInfo?.token && newInfo.applicationId && newInfo.applicationId !== await applicationId()) {
      console.log('\t- onIdentityInfoChanged.sync');

      await SyncWorker.register();

      return startServiceWorker({ name: SyncWorker.name, scheduledTime: null });
    }

    console.log('- onIdentityInfoChanged.register');

    return SyncWorker.register();
  }

  if (newInfo && newInfo.locked) {
    await ensureOptionPage();
  }

  console.log('- onIdentityInfoChanged.processed.deregister');

  return await SyncWorker.deregister();
}
