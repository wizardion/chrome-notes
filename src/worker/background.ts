import { getApplicationId, decrypt } from 'core';
import { ISyncStorageValue, storage } from 'core/services';
import { startServiceWorker } from './components/services';
import { IdentityInfo } from 'modules/sync/components/models/sync.models';
import {
  StorageChange, onSyncInfoChanged, openPopup, onIdentityInfoChanged, initStartupApplication, onPushInfoChanged,
  onSyncDataRemoved, initInstalledApplication
} from './components';


chrome.runtime.onInstalled.addListener(async () => initInstalledApplication());

chrome.runtime.onStartup.addListener(async () => initStartupApplication());

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => startServiceWorker(alarm.name));

chrome.action.onClicked.addListener(async () => openPopup());

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
