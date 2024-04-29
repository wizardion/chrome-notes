import './assets/whats-new.scss';
import { migrate } from 'core/utils/migrate';
import { ISettingsArea, getSettings, setColors } from 'modules/settings';
import { IStorageChange } from 'pages/options/components/options.model';


const mediaColorScheme = '(prefers-color-scheme: dark)';

export function eventOnColorChanged(settings: ISettingsArea, e?: MediaQueryListEvent) {
  return setColors(settings, e);
}

export async function onLocalStorageChanged(changes: IStorageChange) {
  if (changes.settings?.newValue?.value) {
    const settings = <ISettingsArea>changes.settings.newValue.value;

    if (settings.common) {
      setColors(settings);
    }
  }
}

chrome.storage.local.get(['migrate', 'oldNotes']).then(async (local) => {
  const settings = await getSettings({ sync: true, identity: true });
  const content = document.getElementById('content') as HTMLDivElement;
  const footer = document.getElementById('footer') as HTMLDivElement;
  const oldNotes = localStorage.notes || local.oldNotes;

  chrome.storage.local.onChanged.addListener((c) => onLocalStorageChanged(c));
  window.matchMedia(mediaColorScheme).addEventListener('change', (e) => eventOnColorChanged(settings, e));

  if (settings.common?.appearance === 2 || settings.common?.appearance === 0 &&
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
  }

  if (local.migrate && oldNotes) {
    await migrate(oldNotes);
  }

  content.hidden = false;
  footer.hidden = false;
});
