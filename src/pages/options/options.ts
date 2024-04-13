import './assets/options.scss';

import { SyncInfoElement } from './components/sync-info/info';
import { DevModeElement } from './components/dev-mode/dev';
import { PasswordElement } from './components/passwords/password';
import { ProgressElement } from './components/progress-bar/progress';
import { IOptionControls } from './components/options.model';
import { CommonSettingsElement } from './components/common-settings/common-settings.component';
import { AlertElement } from './components/alert/alert.component';
import { getSettings, ISettingsArea } from 'modules/settings';
import {
  devModeChanged, eventOnColorChanged, settingsChanged, syncInfoChanged,
  onLocalStorageChanged, onSyncStorageChanged
} from './components';


const controls: IOptionControls = {};
const mediaColorScheme = '(prefers-color-scheme: dark)';

customElements.define(AlertElement.selector, AlertElement);
customElements.define(ProgressElement.selector, ProgressElement);
customElements.define(PasswordElement.selector, PasswordElement);
customElements.define(CommonSettingsElement.selector, CommonSettingsElement);
customElements.define(SyncInfoElement.selector, SyncInfoElement);
customElements.define(DevModeElement.selector, DevModeElement);

getSettings({ sync: true, identity: true }).then(async (settings: ISettingsArea) => {
  controls.content = <HTMLDivElement>document.getElementById('content');
  controls.syncInfo = <SyncInfoElement>document.querySelector('sync-info');
  controls.devModeInfo = <DevModeElement>document.querySelector('dev-mode-info');
  controls.common = <CommonSettingsElement>document.querySelector('common-settings');
  controls.alert = <AlertElement>document.querySelector('alert-message');

  window.matchMedia(mediaColorScheme).addEventListener('change', (e) => eventOnColorChanged(settings, e));
  controls.syncInfo.addEventListener('sync-info:change', () => syncInfoChanged(controls.syncInfo, settings));
  controls.devModeInfo.addEventListener('mode:change', () => devModeChanged(controls.devModeInfo, settings));
  controls.common.addEventListener('settings:change', () => settingsChanged(settings, controls.common));
  chrome.storage.sync.onChanged.addListener((c) => onSyncStorageChanged(c, controls));
  chrome.storage.local.onChanged.addListener((c) => onLocalStorageChanged(c, controls));

  if (settings.sync) {
    controls.syncInfo.enabled = settings.sync.enabled;
  }

  if (settings.identity) {
    controls.syncInfo.identityId = settings.identity.id;
    controls.syncInfo.passphrase = settings.identity.passphrase;
    controls.syncInfo.locked = settings.identity.locked;
    controls.syncInfo.encrypted = settings.identity.encrypted;
    controls.syncInfo.token = settings.identity.token;
  }

  if (settings.error) {
    controls.alert.error = settings.error.message;
  }

  controls.devModeInfo.enabled = settings.devMode === true;
  controls.common.mode = settings.common?.mode;
  controls.common.editor = settings.common?.editor;
  controls.common.popupSize = settings.common?.popupSize;
  controls.common.appearance = settings.common?.appearance;
  controls.common.expirationDays = settings.common?.expirationDays;
  controls.content.hidden = false;

  if (location.search.match(/develop=true/gi)) {
    const develop = document.getElementById('develop') as HTMLDivElement;

    develop.hidden = false;
  }

  if (settings.common?.appearance === 2 || settings.common?.appearance === 0 &&
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('theme-dark');
  }

  await chrome.storage.session.set({ optionPageId: (await chrome.tabs.getCurrent()).id });
});
