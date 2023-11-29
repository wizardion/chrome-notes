
import { SyncInfoElement } from './sync-info/info.component';
import { DevModeElement } from './dev-mode/dev.component';
import { CommonSettingsElement } from './common-settings/common-settings.component';
import { AlertElement } from './alert/alert.component';


export type IStorageChange = { [key: string]: chrome.storage.StorageChange };
export type IAreaName = chrome.storage.AreaName;

export interface IOptionControls {
  content?: HTMLDivElement,
  syncInfo?: SyncInfoElement,
  devModeInfo?: DevModeElement,
  common?: CommonSettingsElement
  alert?: AlertElement;
}
