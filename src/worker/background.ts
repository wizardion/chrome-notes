import * as core from 'core';
import { ISyncStorageValue, storage } from 'core/services';
// import {migrate} from 'modules/storage/migrate';
import { IdentityInfo } from 'modules/sync/components/models/sync.models';
import { ISettingsArea, ITabInfo } from 'modules/settings/models/settings.model';
import {
  StorageChange, onSyncInfoChanged, openPopup, onIdentityInfoChanged, startServiceWorker, initApplication
} from './components';


chrome.runtime.onInstalled.addListener(async () => initApplication('onInstalled'));

chrome.runtime.onStartup.addListener(async () => initApplication('onStartup'));

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => startServiceWorker(alarm));

chrome.action.onClicked.addListener(async () => {
  const local = await chrome.storage.local.get(['window', 'migrate', 'tabInfo', 'settings']);

  return openPopup(local.settings?.value as ISettingsArea, local.tabInfo as ITabInfo);
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
