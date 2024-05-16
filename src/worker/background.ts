import { getApplicationId, decrypt } from 'core';
import { ISyncStorageValue, storage } from 'core/services';
import { startServiceWorker } from './components/services';
import { IdentityInfo } from 'modules/sync/components/models/sync.models';
import { ISettingsArea, ITabInfo } from 'modules/settings/models/settings.model';
import {
  StorageChange, onSyncInfoChanged, openPopup, onIdentityInfoChanged, initApplication, onPushInfoChanged,
  onSyncDataRemoved
} from './components';


chrome.runtime.onInstalled.addListener(async () => await initApplication('onInstalled'));

chrome.runtime.onStartup.addListener(async () => await initApplication('onStartup'));

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) =>  await startServiceWorker(alarm.name));

chrome.action.onClicked.addListener(async () => {
  const local = await chrome.storage.local.get(['tabInfo', 'settings']);

  return openPopup(local.settings?.value as ISettingsArea, local.tabInfo as ITabInfo);
});

chrome.storage.sync.onChanged.addListener(async (changes: StorageChange) => {
  if (changes.syncInfo?.newValue) {
    const newValue = <ISyncStorageValue>changes.syncInfo.newValue;

    if (newValue.id !== await getApplicationId()) {
      return onSyncInfoChanged(await storage.sync.decrypt(newValue));
    }
  }

  if (changes.syncInfo?.oldValue && !changes.syncInfo?.newValue) {
    return onSyncDataRemoved(await storage.sync.decrypt(<ISyncStorageValue>changes.syncInfo?.oldValue));
  }

  if (changes.pushInfo?.newValue) {
    return onPushInfoChanged(changes.pushInfo.oldValue, changes.pushInfo.newValue);
  }
});

chrome.storage.local.onChanged.addListener(async (changes: StorageChange) => {
  if (changes.identityInfo?.newValue) {
    const newInfo: IdentityInfo = <IdentityInfo> await decrypt(changes.identityInfo.newValue?.value);
    const oldInfo: IdentityInfo = <IdentityInfo> await decrypt(changes.identityInfo.oldValue?.value);

    return onIdentityInfoChanged(oldInfo, newInfo);
  }
});
