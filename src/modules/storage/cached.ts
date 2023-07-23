import { IStorageData } from "./interfaces";


export class CachedStorage {
  public static cache: IStorageData;
  protected static key: string = 'cache';

  public static async set(key: string, value: string | number | object | boolean) {
    if (!value && value !== 0 && value !== false) {
      return this.remove(key);
    }

    this.cache = await this.load(this.key);
    this.cache[key] = { value: value, permanent: false };
    await this.save(this.key, this.cache);
  }

  public static async permanent(key: string, value: string | number | boolean | object) {
    if (!value && value !== 0 && value !== false) {
      return this.remove(key);
    }

    this.cache = await this.load(this.key);
    this.cache[key] = { value: value, permanent: true };
    await this.save(this.key, this.cache);
  }

  public static async get(keys?: string[]): Promise<IStorageData> {
    this.cache = await this.load(this.key);

    if (keys) {
      let result: IStorageData = {};

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        result[key] = this.cache[key] || { value: null, permanent: null };
      }

      return result;
    }

    return this.cache;
  }

  public static async clear() {
    this.cache = await this.load(this.key);
    var keys: string[] = Object.keys(this.cache);

    for (let i = 0; i < keys.length; i++) {
      const key: string = keys[i];

      if (!this.cache[key].permanent) {
        delete this.cache[key];
      }
    }

    await this.save(this.key, this.cache);
  }

  public static async remove(key: string) {
    this.cache = await this.load(this.key);

    if (this.cache[key]) {
      delete this.cache[key];
    }

    await this.save(this.key, this.cache);
  }

  public static async init() {
    const value = (await chrome.storage.local.get(this.key)) || {};
    return await chrome.storage.session.set({ [this.key]: value[this.key] || {} });
  }

  public static async empty() {
    await chrome.storage.session.remove(this.key);
    await chrome.storage.local.remove(this.key);
  }

  protected static async save(key: string, value: IStorageData): Promise<void> {
    chrome.storage.local.set({ [key]: value });
    await chrome.storage.session.set({ [key]: value });
  }

  protected static async load(key: string): Promise<IStorageData> {
    const value = (await chrome.storage.session.get(key)) || {};
    return value[key] || {};
  }
}