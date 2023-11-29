import { LoggerService } from 'modules/logger';
import { SyncWorker } from './sync-worker';
import { IdentityInfo } from 'modules/sync/components/interfaces';
import { removeCachedAuthToken } from 'modules/sync/components/drive';
// import { IWindow } from './models';
import { storage, ISyncInfo } from 'core/services';
import { ISettingsArea, PAGE_MODES, getSettings } from 'modules/settings';


export { BaseWorker } from './base-worker';
export { DataWorker } from './data-worker';
export { SyncWorker } from './sync-worker';
export { IWindow, StorageChange, AreaName } from './models';

const logger = new LoggerService('background/index.ts', 'green');

export async function findTab(tabId: number): Promise<chrome.tabs.Tab> {
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

  return chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
}

export async function initPopup() {
  const settings = await getSettings();
  const mode = PAGE_MODES[settings.common.mode];

  await chrome.action.setPopup({ popup: mode.popup ? mode.popup[settings.common.editor] : '' });
}

// export function openPopup(index: number, editor: number, window?: IWindow, tabId?: number, windowId?: number) {
export function openPopup(settings: ISettingsArea) {
  const mode = PAGE_MODES[settings.common.mode];

  // if (tabId) {
  //   if (windowId) {
  //     chrome.windows.update(windowId, { focused: true });
  //   }

  //   return chrome.tabs.update(tabId, { active: true });
  // }

  return chrome.tabs.create({ url: mode.page ? mode.page[settings.common.editor] : 'option.html' });

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

export async function eventOnSyncInfoChanged(info: ISyncInfo) {
  logger.info('eventOnSyncInfoChanged', { i: info });
  const identity: IdentityInfo = <IdentityInfo> await storage.local.get('identityInfo') || {
    id: null,
    enabled: false,
    token: null,
    passphrase: null,
    encrypted: false,
  };

  if (identity.locked && info.enabled && info.token && !info.encrypted && identity.encrypted) {
    identity.locked = false;
    // await storage.cached.permanent('locked', false);
  }

  if (!identity.locked && info.enabled && info.token && info.encrypted && !identity.passphrase) {
    identity.locked = true;
    // await storage.cached.permanent('locked', true);
  }

  if (!info.encrypted) {
    identity.passphrase = null;
  }

  identity.enabled = info.enabled;
  identity.encrypted = info.encrypted;
  identity.token = info.token;

  await storage.local.sensitive('identityInfo', identity);
}

export async function eventOnIdentityInfoChanged(oldInfo: IdentityInfo, newInfo: IdentityInfo) {
  logger.info('eventOnIdentityInfoChanged', { i: newInfo });

  if (oldInfo && oldInfo.token && (!newInfo || !newInfo.token)) {
    await SyncWorker.deregister();

    return await removeCachedAuthToken(oldInfo.token);
  }

  if (newInfo && newInfo.token && (await SyncWorker.validate(newInfo))) {
    return await SyncWorker.register();
  }

  if (newInfo && newInfo.locked) {
    await ensureOptionPage();
  }

  return await SyncWorker.deregister();
}
