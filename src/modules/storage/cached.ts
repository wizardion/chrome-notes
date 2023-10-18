import { IStorageData } from './interfaces';


export class CachedStorage {
  protected static readonly key = 'cache';
  public static cache: IStorageData;

  public static async set(key: string, value: string | number | object | boolean) {
    if (!value && value !== 0 && value !== false) {
      return this.remove([key]);
    }

    this.cache = this.cache || await this.load();
    this.cache[key] = { value: value, permanent: false };
    await this.save(this.cache);
  }

  public static async permanent(key: string, value: string | number | boolean | object) {
    if (!value && value !== 0 && value !== false) {
      return this.remove([key]);
    }

    this.cache = this.cache || await this.load();
    this.cache[key] = { value: value, permanent: true };
    await this.save(this.cache);
  }

  public static async get(keys?: string[]): Promise<IStorageData> {
    this.cache = this.cache || await this.load();

    if (keys) {
      const result: IStorageData = {};

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        result[key] = this.cache[key] || { value: null, permanent: null };
      }

      return result;
    }

    return this.cache;
  }

  public static async clear() {
    this.cache = this.cache || await this.load();
    const keys: string[] = Object.keys(this.cache);

    for (let i = 0; i < keys.length; i++) {
      const key: string = keys[i];

      if (!this.cache[key].permanent) {
        delete this.cache[key];
      }
    }

    await this.save(this.cache);
  }

  public static async remove(keys: string[]) {
    this.cache = this.cache || await this.load();

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (this.cache[key]) {
        delete this.cache[key];
      }
    }

    await this.save(this.cache);
  }

  public static async init() {
    const value = (await chrome.storage.local.get(this.key)) || {};

    await chrome.storage.session.set({ [this.key]: value[this.key] });
  }

  public static async empty() {
    await chrome.storage.local.remove(this.key);
    await chrome.storage.session.remove(this.key);
  }

  protected static async save(value: IStorageData): Promise<void> {
    await chrome.storage.local.set({ [this.key]: value });
    await chrome.storage.session.set({ [this.key]: value });
  }

  protected static async load(): Promise<IStorageData> {
    const value = (await chrome.storage.session.get(this.key)) || {};

    return value[this.key] || {};
  }
}
