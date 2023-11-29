import { ISyncInfo } from 'core/services';
import { IdentityInfo } from 'modules/sync/components/interfaces';


export interface ISettingsOptions {
  sync?: boolean,
  identity?: boolean
}

export interface IPageMode {
  popup: string[];
  page: string[] | null;
}

export interface ICommonSettings {
  mode: number | null;
  editor: number | null;
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
