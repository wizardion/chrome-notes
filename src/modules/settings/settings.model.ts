import { ISyncInfo, IdentityInfo } from 'modules/sync/components/interfaces';


export interface IPageMode {
  popup: string;
  page: string | null;
}

export const pageModes: Record<number, IPageMode> = {
  0: { popup: 'popup.html', page: null },
  1: { popup: 'popup.html', page: null },
  3: { popup: '', page: 'popup.html' }
};

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
