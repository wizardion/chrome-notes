import { SyncInfoElement } from './sync-info/info.component';
import { IOptionControls, IStorageChange } from './options.model';
import { DevModeElement } from './dev-mode/dev.component';
import { CommonSettingsElement } from './common-settings/common-settings.component';
import { ISettingsArea, getPopupPage, getSettings, setColors } from 'modules/settings';
import { ISyncInfo, ISyncStorageValue, storage } from 'core/services';
import { CachedStorageService } from 'core/services/cached';
import { ITabInfo } from 'modules/settings/models/settings.model';
import { db } from 'modules/db';
import * as core from 'core';


async function findTab(tabId: number): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({});

  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].id === tabId) {
      return tabs[i];
    }
  }

  return null;
}

async function resetOpenedTabs() {
  const local = await chrome.storage.local.get('tabInfo');

  if (local.tabInfo) {
    const tabInfo = local.tabInfo as ITabInfo;
    const tab = await findTab(tabInfo.id);

    if (tab) {
      await chrome.tabs.remove(tab.id);
    }
  }
}

async function resetTextSelection() {
  const items = await db.dump();
  const cache = await CachedStorageService.dump();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    item.cState = [0, 0];
    item.pState = null;

    db.enqueue(item, 'update');
  }

  if (cache.selected) {
    cache.selected.cState = [0, 0];
    cache.selected.pState = null;

    await CachedStorageService.set('selected', cache.selected);
  }

  await db.dequeue();
}

export function eventOnColorChanged(settings: ISettingsArea, e?: MediaQueryListEvent) {
  return setColors(settings, e);
}

export async function settingsChanged(element?: CommonSettingsElement) {
  const settings = await getSettings();

  if (settings.common.editor !== element?.editor) {
    await resetTextSelection();
  }

  if (settings.common.mode !== element?.mode) {
    await resetOpenedTabs();
  }

  settings.common = {
    mode: element.mode,
    editor: element.editor,
    popupSize: element.popupSize,
    appearance: element.appearance,
    expirationDays: element.expirationDays,
  };

  eventOnColorChanged(settings);
  await chrome.action.setPopup({ popup: getPopupPage(settings.common) });
  await storage.local.set('settings', settings);
}

export async function syncInfoChanged(element: SyncInfoElement) {
  const applicationId = await core.getApplicationId();

  await storage.sync.set({
    token: element.token,
    fileId: element.fileId,
    enabled: element.enabled,
    encrypted: element.encrypted,
    applicationId: applicationId
  });
  await storage.local.sensitive('identityInfo', {
    token: element.token,
    fileId: element.fileId,
    enabled: element.enabled,
    passphrase: element.passphrase,
    encrypted: element.encrypted,
    locked: element.locked
  });
}

export async function devModeChanged(element: DevModeElement) {
  const settings = await getSettings();

  settings.devMode = element.enabled;

  await storage.local.set('settings', settings);
}

export async function onSyncStorageChanged(changes: IStorageChange, controls: IOptionControls) {
  if (!controls.syncInfo.promise && changes.syncInfo) {
    const data = <ISyncStorageValue>changes.syncInfo.newValue;

    if ((data && data.id !== (await core.getApplicationId())) || !data) {
      const info: ISyncInfo = await storage.sync.decrypt(data);

      if (controls.syncInfo.locked && info.enabled && info.token && !info.encrypted && controls.syncInfo.encrypted) {
        controls.syncInfo.locked = false;
      }

      if (!controls.syncInfo.locked && info.enabled && info.token && info.encrypted && !controls.syncInfo.passphrase) {
        controls.syncInfo.locked = true;
      }

      if (!info.encrypted) {
        controls.syncInfo.passphrase = null;
      }

      controls.syncInfo.enabled = info.enabled;
      controls.syncInfo.encrypted = info.encrypted;
      controls.syncInfo.token = info.token;
    }
  }
}

export async function onLocalStorageChanged(changes: IStorageChange, controls: IOptionControls) {
  if (changes.settings?.newValue?.value) {
    const settings = <ISettingsArea>changes.settings.newValue.value;

    if (settings.error) {
      controls.alert.error = settings.error.message;
    }
  }
}
