import './assets/whats-new.scss';
import { migrate } from 'core/utils/migrate';
import { ISettingsArea, getSettings, setColors } from 'modules/settings';
import { ProgressElement } from 'pages/components/progress-bar/progress.component';
import { IStorageChange } from 'pages/options/components/options.model';


const mediaColorScheme = '(prefers-color-scheme: dark)';

function eventOnColorChanged(settings: ISettingsArea, e?: MediaQueryListEvent) {
  return setColors(settings, e);
}

async function onLocalStorageChanged(changes: IStorageChange) {
  if (changes.settings?.newValue?.value) {
    const settings = <ISettingsArea>changes.settings.newValue.value;

    if (settings.common) {
      setColors(settings);
    }
  }
}

customElements.define(ProgressElement.selector, ProgressElement);
customElements.whenDefined(ProgressElement.selector).then(async () => {
  const local = await chrome.storage.local.get(['migrate', 'oldNotes']);
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
    const progress = document.createElement('progress-bar') as ProgressElement;

    try {
      document.body.insertBefore(progress, document.body.firstElementChild);
      progress.spinning = true;

      await migrate(oldNotes);

      return progress.finish().then(() => {
        progress.remove();
        content.hidden = false;
        footer.hidden = false;
      });
    } catch (error) {
      return progress.finish().then(() => {
        const message = document.getElementById('error') as HTMLDivElement;

        progress.remove();
        message.hidden = false;
        footer.hidden = false;
        console.log('error', error);
      });
    }
  }

  content.hidden = false;
  footer.hidden = false;
});
