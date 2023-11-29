import { IStorageValue } from './local-storage.models';
import { encrypt, decrypt } from 'core';


export class LocalStorageService {
  public static async get<T>(key: string, defaults?: T): Promise<T> {
    const data = (await chrome.storage.local.get(key) || {})[key] as IStorageValue<T>;

    if (data?.sensitive) {
      return decrypt(String(data.value)) as T;
    }

    return (data?.value || defaults) as T;
  }

  public static async set<T>(key: string, value: T): Promise<void> {
    return chrome.storage.local.set({ [key]: <IStorageValue<T>> { value } });
  }

  public static async sensitive<T>(key: string, value: T): Promise<void> {
    return chrome.storage.local.set({
      [key]: <IStorageValue<T>> { sensitive: true, value: await encrypt(value) },
    });
  }

  public static async remove(key: string) {
    return chrome.storage.local.remove(key);
  }
}
