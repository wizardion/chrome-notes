import { getApplicationId, decrypt } from 'core';
import { ISyncStorageValue, storage } from 'core/services';
import { startServiceWorker } from './components/services';
import { IdentityInfo } from 'modules/sync/components/models/sync.models';
import {
  StorageChange, onSyncInfoChanged, openPopup, onIdentityInfoChanged, initApplication, onPushInfoChanged,
  initInstalledApplication, onAppConnected, onIdleActiveStateChanged,
  onIdleLockedStateChanged
} from './components';


chrome.runtime.onInstalled.addListener(async (details: chrome.runtime.InstalledDetails) => {
  if ([chrome.runtime.OnInstalledReason.INSTALL, chrome.runtime.OnInstalledReason.UPDATE].includes(details.reason)) {
    return initInstalledApplication();
  }
});

chrome.runtime.onStartup.addListener(async () => initApplication());

chrome.runtime.onConnect.addListener((port: chrome.runtime.Port) => onAppConnected(port));

chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => startServiceWorker(alarm.name));

chrome.action.onClicked.addListener(async () => openPopup());

chrome.idle.onStateChanged.addListener(async (newState: chrome.idle.IdleState) => {
  return (newState === 'active') ? onIdleActiveStateChanged() : onIdleLockedStateChanged();
});

chrome.storage.sync.onChanged.addListener(async (changes: StorageChange) => {
  if (changes.syncInfo) {
    const newValue = <ISyncStorageValue>changes.syncInfo.newValue;

    if (!newValue || newValue.id !== await getApplicationId()) {
      return onSyncInfoChanged(await storage.sync.decrypt(newValue));
    }
  }

  if (changes.pushInfo?.newValue) {
    return onPushInfoChanged(changes.pushInfo.oldValue, changes.pushInfo.newValue);
  }
});

chrome.storage.local.onChanged.addListener(async (changes: StorageChange) => {
  if (changes.identityInfo?.newValue) {
    const newInfo = <IdentityInfo> await decrypt(changes.identityInfo.newValue?.value);
    const oldInfo = <IdentityInfo> await decrypt(changes.identityInfo.oldValue?.value);

    return onIdentityInfoChanged(oldInfo, newInfo);
  }
});
