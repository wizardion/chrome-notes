import { ISyncInfo } from 'core/services';
import { IdentityInfo } from 'modules/sync/components/models/sync.models';


export interface ISettingsOptions {
  sync?: boolean,
  identity?: boolean
}

export interface IPageMode {
  popup: string[][][] | null;
  page: string | null;
}

export interface ICommonSettings {
  mode: number | null;
  editor: number | null;
  popupSize: number | null;
  appearance: number | null;
  expirationDays: number | null;
}

export interface ISettingsError {
  message: string;
  worker: string;
}

export interface ISettingsArea {
  devMode: boolean;
  sync: ISyncInfo | null;
  common: ICommonSettings;
  identity?: IdentityInfo | null;
  error?: ISettingsError | null;
}

export interface ITabInfo {
  id: number;
  window: number;
  top?: number;
  left?: number;
  width?: number;
  height?: number;
}
