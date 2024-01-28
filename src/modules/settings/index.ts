import { LocalStorageService } from 'core/services/local';
import { SyncStorageService } from 'core/services/sync';
import { ICommonSettings, IPageMode, ISettingsArea, ISettingsOptions } from './settings.model';
import { IdentityInfo } from 'modules/sync/components/interfaces';


const settingsOptions: ISettingsOptions = {
  sync: false,
  identity: false
};

export const DEFAULT_SETTINGS: ISettingsArea = {
  devMode: false,
  sync: null,
  common: {
    mode: 0,
    editor: 0,
    popupSize: 0,
    appearance: 0,
    expirationDays: 3,
  }
};

export const PAGE_MODES: Record<number, IPageMode> = {
  0: {
    popup: [
      [
        ['popup.html', 'popup-light.html', 'popup-dark.html'],
        ['popup-middle.html', 'popup-middle-light.html', 'popup-middle-dark.html']
      ],
      [
        ['popup-visual.html', 'popup-visual-light.html', 'popup-visual-dark.html'],
        ['popup-visual-middle.html', 'popup-visual-middle-light.html', 'popup-visual-middle-dark.html']
      ],
    ],
    page: null
  },
  1: {
    popup: [
      [
        ['popup.html', 'popup-light.html', 'popup-dark.html'],
        ['popup-middle.html', 'popup-middle-light.html', 'popup-middle-dark.html']
      ],
      [
        ['popup-visual.html', 'popup-visual-light.html', 'popup-visual-dark.html'],
        ['popup-visual-middle.html', 'popup-visual-middle-light.html', 'popup-visual-middle-dark.html']
      ],
    ],
    page: null
  },
  3: { popup: null, page: 'popup.html' }
};

export { ISettingsArea };

export async function getSettings(options: ISettingsOptions = settingsOptions): Promise<ISettingsArea> {
  const settings = await LocalStorageService.get<ISettingsArea>('settings', DEFAULT_SETTINGS);

  return {
    devMode: ('devMode' in settings) ? settings.devMode : DEFAULT_SETTINGS.devMode,
    common: { ...DEFAULT_SETTINGS.common, ...settings.common },
    sync: options.sync ? await SyncStorageService.get() : null,
    identity: options.identity ? await LocalStorageService.get<IdentityInfo>('identityInfo') : null,
    error: settings.error
  };
}

export function getPopupPage(settings: ICommonSettings) {
  const mode = PAGE_MODES[settings.mode];

  return mode.popup ? mode.popup[settings.editor][settings.popupSize][settings.appearance] : '';
}
