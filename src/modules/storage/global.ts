import { IStorageData } from "./interfaces";


export class GlobalStorage {
  public static async clear() {
    await chrome.storage.local.clear();
    await chrome.storage.session.clear();
    await chrome.storage.sync.clear();
  }

  public static async get(keys?: string[], namespace?: 'local|session|sync') {
    return {
      local: await chrome.storage.local.get(),
      session: await chrome.storage.session.get(),
      sync: await chrome.storage.sync.get(),
    };
  }

  public static async set(keys?: string[], namespace?: 'local|session|sync') {
    
  }
}