import 'styles/options.scss';

import * as core from 'modules/core';
import storage from 'modules/storage/storage';
import { IStorageData, IStorageValue, ISyncStorageValue } from 'modules/storage/interfaces';
import { ViewStyleElement } from './components/view-style/style';
import { SyncInfoElement } from './components/sync-info/info';
import { DevModeElement } from './components/dev-mode/dev';
import { PasswordElement } from './components/passwords/password';
import { ProgressElement } from './components/progress-bar/progress';
import { ISyncInfo, IdentityInfo } from 'modules/sync/components/interfaces';


type StorageChange = { [key: string]: chrome.storage.StorageChange };
type AreaName = chrome.storage.AreaName;
type SettingsArea = {
  devMode: boolean;
  mode: number;
  sync: ISyncInfo;
  identity: IdentityInfo;
  promise: boolean;
  message: string;
};

const controls: { syncInfo?: SyncInfoElement, devModeInfo?: DevModeElement, viewStyle?: ViewStyleElement } = {};
const settings: SettingsArea = {
  mode: null,
  devMode: null,
  sync: null,
  identity: null,
  promise: false,
  message: null,
};

customElements.define('progress-bar', ProgressElement);
customElements.define('user-password', PasswordElement);
customElements.define('view-style', ViewStyleElement);
customElements.define('sync-info', SyncInfoElement);
customElements.define('dev-mode-info', DevModeElement);

(async () => {
  controls.syncInfo = <SyncInfoElement>document.querySelector('sync-info');
  controls.devModeInfo = <DevModeElement>document.querySelector('dev-mode-info');
  controls.viewStyle = <ViewStyleElement>document.querySelector('view-style');

  // settings.cached = await storage.local.get(['mode', 'devMode']);
  settings.devMode = <boolean>await storage.local.get('devMode');
  settings.mode = <number>await storage.local.get('mode');
  
  settings.identity = <IdentityInfo>await storage.local.get('identityInfo');
  settings.sync = await storage.sync.get();
  settings.message = <string>(await chrome.storage.session.get('errorMessage')).errorMessage;

  controls.syncInfo.addEventListener('sync-info:change', () => syncInfoChanged(controls.syncInfo));
  controls.devModeInfo.addEventListener('mode:change', () => devModeChanged(controls.devModeInfo));
  controls.viewStyle.addEventListener('view:change', () => viewChanged(controls.viewStyle));
  chrome.storage.onChanged.addListener(eventOnStorageChanged);

  if (settings.sync) {
    controls.syncInfo.enabled = settings.sync.enabled;
  }

  if (settings.identity) {
    controls.syncInfo.passphrase = settings.identity.passphrase;
    controls.syncInfo.locked = settings.identity.locked;
    controls.syncInfo.encrypted = settings.identity.encrypted;
    controls.syncInfo.token = settings.identity.token;    
  }

  if (settings.message) {
    controls.syncInfo.message = settings.message;
  }

  controls.devModeInfo.enabled = settings.devMode === true;
  controls.viewStyle.value = settings.mode;

  await chrome.storage.session.set({ optionPageId: (await chrome.tabs.getCurrent()).id });
})();

async function viewChanged(element: ViewStyleElement) {
  const mode = element.value;

  if (mode === 3 || mode === 4) {
    chrome.action.setPopup({ popup: '' });
  } else {
    chrome.action.setPopup({ popup: 'popup.html' });
  }

  await storage.local.set('mode', mode);
  await storage.cached.permanent('mode', mode);
}

async function syncInfoChanged(element: SyncInfoElement) {
  var syncInfo: ISyncInfo = settings.sync;
  var identityInfo: IdentityInfo = settings.identity;

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

  settings.sync = syncInfo;
  settings.identity = identityInfo;

  await storage.sync.set(syncInfo);
  await storage.local.sensitive('identityInfo', identityInfo);
}

async function devModeChanged(element: DevModeElement) {
  await storage.local.set('devMode', element.enabled);
}

async function eventOnStorageChanged(changes: StorageChange, namespace: AreaName) {
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

  if (namespace === 'session' && !controls.syncInfo.promise && changes.errorMessage && changes.errorMessage.newValue) {
    const message = changes.errorMessage.newValue;

    controls.syncInfo.message = message;
  }
}
