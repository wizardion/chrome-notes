import { SyncWorker } from './sync-worker';
import { BaseWorker, workerLogger } from './base-worker';
import { DataWorker } from './data-worker';
import { TerminateProcess } from '../models/models';
import { getSettings } from 'modules/settings';
import { LocalStorageService } from 'core/services/local';
import { PushWorker } from './push-worker';


export const serviceWorkers: (typeof BaseWorker)[] = [PushWorker, DataWorker, SyncWorker];

export async function findTab(tabId: number): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({});

  for (let i = 0; i < tabs.length; i++) {
    if (tabs[i].id === tabId) {
      return tabs[i];
    }
  }

  return null;
}

export async function ensureOptionPage() {
  const data = await chrome.storage.session.get('optionPageId');

  if (data && data.optionPageId) {
    const tab = await findTab(<number>data.optionPageId);

    if (tab) {
      return chrome.tabs.update(tab.id, { active: true });
    }
  }

  return chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
}

export async function startServiceWorker(name: string) {
  const settings = await getSettings();

  for (let i = 0; i < serviceWorkers.length; i++) {
    const Base = serviceWorkers[i];

    if (name === Base.name) {
      const worker = new Base(settings);

      try {
        if (!await worker.busy()) {
          await worker.start();
          await worker.process();
          await worker.finish();
        }

        if (settings.error?.worker === worker.name) {
          settings.error = null;
          await LocalStorageService.set('settings', settings);
        }
      } catch (error) {
        const message = error.message || String(error);

        await worker.finish();
        await workerLogger.warn('An error occurred during the process: ', message);
        settings.error = { message: `${message}`, worker: worker.name };

        if (error instanceof TerminateProcess) {
          await serviceWorkers.find(i => i.name === error.worker)?.deregister();
          await LocalStorageService.set('settings', settings);
          await ensureOptionPage();
        }
      }
    }
  }
}
