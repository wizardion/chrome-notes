import { SyncInfoElement } from './sync-info/info.component';
import { IAreaName, IOptionControls, IStorageChange } from './options.model';
import { DevModeElement } from './dev-mode/dev.component';
import { CommonSettingsElement } from './common-settings/common-settings.component';
import { ISettingsArea, getPopupPage } from 'modules/settings';
import { ISyncInfo, ISyncStorageValue, storage } from 'core/services';
import { CachedStorageService } from 'core/services/cached';
import { db } from 'modules/db';
import * as core from 'core';


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

  if (cache.draft) {
    cache.draft.selection = [0, 0];

    await CachedStorageService.set('draft', cache.draft);
  }

  await db.dequeue();
}

export function eventOnColorChanged(settings: ISettingsArea, e?: MediaQueryListEvent) {
  const dark = e ? e.matches : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (settings.common?.appearance === 2 || settings.common?.appearance === 0 && dark) {
    document.body.classList.add('theme-dark');
  } else {
    document.body.classList.remove('theme-dark');
  }
}

export async function settingsChanged(element: CommonSettingsElement, settings: ISettingsArea) {
  if (settings.common.editor !== element.editor) {
    await resetTextSelection();
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

export async function syncInfoChanged(element: SyncInfoElement, current: ISettingsArea) {
  let syncInfo = current.sync;
  let identityInfo = current.identity;

  if (syncInfo) {
    syncInfo.id = await core.applicationId();
    syncInfo.enabled = element.enabled;
    syncInfo.token = element.token;
    syncInfo.encrypted = element.encrypted;
  } else {
    syncInfo = {
      id: await core.applicationId(),
      enabled: element.enabled,
      token: element.token,
      encrypted: element.encrypted,
    };
  }

  if (identityInfo) {
    identityInfo.enabled = syncInfo.enabled;
    identityInfo.token = element.token;
    identityInfo.passphrase = element.passphrase;
    identityInfo.encrypted = syncInfo.encrypted;
    identityInfo.locked = element.locked;
  } else {
    identityInfo = {
      id: null,
      enabled: syncInfo.enabled,
      token: element.token,
      passphrase: element.passphrase,
      encrypted: element.encrypted,
      locked: element.locked,
    };
  }

  current.sync = syncInfo;
  current.identity = identityInfo;

  await storage.sync.set(syncInfo);
  await storage.local.sensitive('identityInfo', identityInfo);
}

export async function devModeChanged(element: DevModeElement, current: ISettingsArea) {
  current.devMode = element.enabled;

  await storage.local.set('settings', current);
}

export async function eventOnStorageChanged(changes: IStorageChange, namespace: IAreaName, controls: IOptionControls) {
  if (namespace === 'sync' && !controls.syncInfo.promise && changes.syncInfo) {
    const data = <ISyncStorageValue>changes.syncInfo.newValue;

    if ((data && data.id !== (await core.applicationId())) || !data) {
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

  if (namespace === 'local' && changes.settings && changes.settings.newValue) {
    const settings = <ISettingsArea> changes.settings.newValue;

    if (settings.error) {
      controls.alert.error = settings.error.message;
    }
  }
}
