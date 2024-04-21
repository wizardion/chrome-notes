import * as core from 'core';
// import {migrate} from 'modules/storage/migrate';
import { ISyncStorageValue, storage } from 'core/services';
import { startServiceWorker } from './components/services';
import { IdentityInfo } from 'modules/sync/components/models/sync.models';
import { ISettingsArea, ITabInfo } from 'modules/settings/models/settings.model';
import {
  StorageChange, onSyncInfoChanged, openPopup, onIdentityInfoChanged, initApplication, onPushInfoChanged
} from './components';


chrome.runtime.onInstalled.addListener(async () => initApplication('onInstalled'));

chrome.runtime.onStartup.addListener(async () => initApplication('onStartup'));

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => startServiceWorker(alarm.name));

chrome.action.onClicked.addListener(async () => {
  const local = await chrome.storage.local.get(['window', 'migrate', 'tabInfo', 'settings']);

  return openPopup(local.settings?.value as ISettingsArea, local.tabInfo as ITabInfo);
});

chrome.storage.sync.onChanged.addListener(async (changes: StorageChange) => {
  if (changes.syncInfo?.newValue) {
    const data = <ISyncStorageValue>changes.syncInfo.newValue;

    if (!data || (data && data.id !== await core.getApplicationId())) {
      return onSyncInfoChanged(await storage.sync.decrypt(data));
    }
  }

  if (changes.pushInfo?.newValue) {
    onPushInfoChanged(changes.pushInfo.oldValue, changes.pushInfo.newValue);
  }
});

chrome.storage.local.onChanged.addListener(async (changes: StorageChange) => {
  if (changes.identityInfo?.newValue) {
    const newInfo: IdentityInfo = <IdentityInfo> await core.decrypt(changes.identityInfo.newValue?.value);
    const oldInfo: IdentityInfo = <IdentityInfo> await core.decrypt(changes.identityInfo.oldValue?.value);

    return onIdentityInfoChanged(oldInfo, newInfo);
  }
});
