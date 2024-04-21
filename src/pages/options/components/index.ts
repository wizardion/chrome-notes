import { SyncInfoElement } from './sync-info/info.component';
import { IOptionControls, IStorageChange } from './options.model';
import { DevModeElement } from './dev-mode/dev.component';
import { CommonSettingsElement } from './common-settings/common-settings.component';
import { ISettingsArea, getPopupPage, setColors } from 'modules/settings';
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

  await db.dequeue();
}

export function eventOnColorChanged(settings: ISettingsArea, e?: MediaQueryListEvent) {
  return setColors(settings, e);
}

export async function settingsChanged(settings: ISettingsArea, element?: CommonSettingsElement) {
  if (settings.common.editor !== element?.editor) {
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
  const applicationId = await core.getApplicationId();

  if (syncInfo) {
    syncInfo.token = element.token;
    syncInfo.enabled = element.enabled;
    syncInfo.encrypted = element.encrypted;
    syncInfo.applicationId = applicationId;
  } else {
    syncInfo = {
      token: element.token,
      enabled: element.enabled,
      encrypted: element.encrypted,
      applicationId: applicationId,
    };
  }

  if (identityInfo) {
    identityInfo.fileId = element.fileId;
    identityInfo.enabled = syncInfo.enabled;
    identityInfo.token = element.token;
    identityInfo.passphrase = element.passphrase;
    identityInfo.encrypted = syncInfo.encrypted;
    identityInfo.applicationId = applicationId;
    identityInfo.locked = element.locked;
  } else {
    identityInfo = {
      fileId: element.fileId,
      enabled: syncInfo.enabled,
      token: element.token,
      applicationId: applicationId,
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
