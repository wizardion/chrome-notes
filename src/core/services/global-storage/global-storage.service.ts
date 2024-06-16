import { IGlobalStorageItem } from './models/global-storage.models';


export class GlobalStorageService {
  public static async get(): Promise<IGlobalStorageItem> {
    return {
      local: await chrome.storage.local.get(),
      session: await chrome.storage.session.get(),
      sync: await chrome.storage.sync.get(),
    };
  }

  public static async clearLocal() {
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();
  }

  public static async clear() {
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();
    await chrome.storage.sync.clear();
  }
}
