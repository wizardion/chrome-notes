import { SyncWorker } from './sync-worker';
import { IdentityInfo } from 'modules/sync/components/models/sync.models';
// import { GoogleDrive } from 'modules/sync/components/drive';
// import { IWindow } from './models';
import { storage, ISyncInfo } from 'core/services';
import { ISettingsArea, PAGE_MODES, getPopupPage, getSettings } from 'modules/settings';
import { ITabInfo } from 'modules/settings/models/settings.model';
import { applicationId } from 'core/index';


export { BaseWorker } from './base-worker';
export { DataWorker } from './data-worker';
export { SyncWorker } from './sync-worker';
export { IWindow, StorageChange, AreaName } from './models/models';


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

export async function onSyncInfoChanged(info: ISyncInfo) {
  const identity = await storage.local.get<IdentityInfo>('identityInfo') || {
    id: null,
    fileId: null,
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

  identity.id = info.id;
  identity.enabled = info.enabled;
  identity.encrypted = info.encrypted;
  identity.token = info.token;

  console.log('- onSyncInfoChanged.processed', { identity, info });

  await storage.local.sensitive('identityInfo', identity);
}

export async function onIdentityInfoChanged(oldInfo: IdentityInfo, newInfo: IdentityInfo) {
  console.log('- onIdentityInfoChanged', { oldInfo, newInfo });

  if (oldInfo && oldInfo.token && (!newInfo || !newInfo.token)) {
    console.log('- onIdentityInfoChanged.deregister.removeCachedAuthToken');

    return await SyncWorker.deregister();

    // console.log('- onIdentityInfoChanged.removeCachedAuthToken');

    // return await GoogleDrive.deauthorize(oldInfo.token);
  }

  if (newInfo && newInfo.token && (await SyncWorker.validate(newInfo))) {
    const id = await applicationId();

    if (!oldInfo?.token && newInfo.id && newInfo.id !== id) {
      //   try {
      //     console.log('\tnew token -> sync...');
      //     await Cloud.wait();
      //     await Cloud.sync();

      //     return await SyncWorker.register();
      //   } catch (error) {
      //     const settings = await getSettings();
      //     const message = error.message || String(error);

      //     settings.error = { message: `${message}`, worker: SyncWorker.name };

      //     await storage.local.set('settings', settings);
      //     await ensureOptionPage();

      //     return await SyncWorker.register();
      //   }
      console.log('\t- onIdentityInfoChanged.sync', [id, newInfo.id]);
    }

    console.log('- onIdentityInfoChanged.register');

    return await SyncWorker.register();
  }

  if (newInfo && newInfo.locked) {
    await ensureOptionPage();
  }

  console.log('- onIdentityInfoChanged.processed.deregister');

  return await SyncWorker.deregister();
}
