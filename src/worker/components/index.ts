import * as core from 'core';
import { LoggerService } from 'modules/logger';
import { storage, ISyncInfo } from 'core/services';
import { SyncWorker } from './services/sync-worker';
import { DataWorker } from './services/data-worker';
import { CachedStorageService } from 'core/services/cached';
import { IdentityInfo } from 'modules/sync/components/models/sync.models';
import { ISettingsArea, PAGE_MODES, getPopupPage, getSettings } from 'modules/settings';
import { ITabInfo } from 'modules/settings/models/settings.model';
import { ensureOptionPage, findTab } from './services';


export { StorageChange } from './models/models';


const logger = new LoggerService('background.ts', 'green');


export async function initPopup() {
  const settings = await getSettings();

  await chrome.action.setPopup({ popup: getPopupPage(settings.common) });
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
    await SyncWorker.register(1);
  }

  DataWorker.register();
  await initPopup();
}

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

  // export function openPopup(index: number, editor: number, window?: IWindow, tabId?: number, windowId?: number) {
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

// export async function onLocalPushInfoChanged(oldValue: number, newValue: number) {
//   await logger.info('onLocalPushInfoChanged...', oldValue, newValue);

//   if (oldValue !== newValue && newValue > 1) {
//     const alarm = await chrome.alarms.get(PushWorker.name);

//     if (!alarm) {
//       await chrome.alarms.create(PushWorker.name, { delayInMinutes: PushWorker.period });
//     }
//   }
// }

// export async function onSyncPushInfoChanged(oldValue: ISyncPushInfo, newValue: ISyncPushInfo) {
//   await logger.info('onSyncPushInfoChanged...', newValue.applicationId !== oldValue?.applicationId);

//   if (newValue && newValue.applicationId !== oldValue?.applicationId
//       && newValue.applicationId !== await core.applicationId()) {
//     await PushWorker.push(1);
//   }
// }

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

  await storage.local.sensitive('identityInfo', identity);
}

export async function onIdentityInfoChanged(oldInfo: IdentityInfo, newInfo: IdentityInfo) {
  if (oldInfo && oldInfo.token && (!newInfo || !newInfo.token)) {
    await SyncWorker.deregister();

    return SyncWorker.removeCache(oldInfo.token);
  }

  if (newInfo && newInfo.token && (await SyncWorker.validate(newInfo))) {
    if (!oldInfo?.token && newInfo.applicationId && newInfo.applicationId !== await core.applicationId()) {
      await SyncWorker.register(1);
    }

    return SyncWorker.register();
  }

  if (newInfo && newInfo.locked) {
    await ensureOptionPage();
  }

  return await SyncWorker.deregister();
}
