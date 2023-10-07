import { ISyncInfo, IdentityInfo } from 'modules/sync/components/interfaces';
import { SyncInfoElement } from './sync-info/info.component';
import { DevModeElement } from './dev-mode/dev.component';
import { CommonSettingsElement } from './common-settings/common-settings.component';


export type IStorageChange = { [key: string]: chrome.storage.StorageChange };
export type IAreaName = chrome.storage.AreaName;

export interface ICommonSettings {
  mode: number | null;
  expirationDays: number | null;
}

export interface ISettingsError {
  message: string;
  promise?: boolean | null;
}

export interface ISettingsArea {
  devMode: boolean;
  sync: ISyncInfo | null;
  common: ICommonSettings;
  identity?: IdentityInfo | null;
  error?: ISettingsError | null;
}

export interface IOptionControls {
  content?: HTMLDivElement,
  syncInfo?: SyncInfoElement,
  devModeInfo?: DevModeElement,
  common?: CommonSettingsElement
}

export const defaultSettings: ISettingsArea = {
  devMode: false,
  sync: null,
  common: {
    mode: 0,
    expirationDays: 3
  }
};
