import './assets/colors.scss';
import './assets/body.scss';
import { ISettingsArea, getSettings } from 'modules/settings';
import { IAreaName, IStorageChange } from 'pages/options/components/options.model';
import { IEventListener } from 'core/components';


const mediaColorScheme = '(prefers-color-scheme: dark)';
const listeners = new Map<string, IEventListener>();

function eventOncColorChanged(settings: ISettingsArea, e?: MediaQueryListEvent) {
  const dark = e ? e.matches : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (settings.common?.appearance === 2 || settings.common?.appearance === 0 && dark) {
    document.body.classList.add('theme-dark');
  } else {
    document.body.classList.remove('theme-dark');
  }
}

function eventOnStorageChanged(changes: IStorageChange, namespace: IAreaName) {
  if (namespace === 'local' && changes.settings && changes.settings.newValue) {
    const settings = changes.settings?.newValue.value as ISettingsArea;

    if (settings.common?.appearance !== 0) {
      window.matchMedia(mediaColorScheme).removeEventListener('change', listeners.get('media:change'));
    }

    if (settings.common?.appearance === 0) {
      listeners.set('media:change', (e) => eventOncColorChanged(settings, e as MediaQueryListEvent));
      window.matchMedia(mediaColorScheme).addEventListener('change', listeners.get('media:change'));
    }

    eventOncColorChanged(settings);
  }
}

function addEventListeners(settings: ISettingsArea) {
  chrome.storage.onChanged.addListener((c, n) => eventOnStorageChanged(c, n));

  if (settings.common?.appearance === 0) {
    listeners.set('media:change', (e) => eventOncColorChanged(settings, e as MediaQueryListEvent));
    window.matchMedia(mediaColorScheme).addEventListener('change', listeners.get('media:change'));
  }
}

getSettings({ sync: true, identity: true }).then(settings => {
  if (settings.common.editor === 0 || window.location.search.includes('t=markdown')) {
    import('./markdown').then(({ init, whenDefined }) => whenDefined().then(() => init()));
  } else if (settings.common.editor === 1) {
    import('./visual').then(({ init, whenDefined }) => whenDefined().then(() => init()));
  }

  if (settings.common?.appearance === 2 || settings.common?.appearance === 0 &&
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('theme-dark');
  }

  setTimeout(() => addEventListeners(settings), 300);
});
