import { IGlobalStorageItem } from './models/global-storage.models';


export class GlobalStorageService {
  public static async get(): Promise<IGlobalStorageItem> {
    return {
      local: await chrome.storage.local.get(),
      session: await chrome.storage.session.get(),
      sync: await chrome.storage.sync.get(),
    };
  }

  public static async remove(namespace: 'local' | 'session' |' sync') {
    if (namespace === 'local') {
      await chrome.storage.local.clear();
    }

    if (namespace === 'session') {
      await chrome.storage.session.clear();
    }

    if (namespace === ' sync') {
      await chrome.storage.sync.clear();
    }
  }

  public static async clear() {
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();
    await chrome.storage.sync.clear();
  }
}
