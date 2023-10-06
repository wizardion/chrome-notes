import { IDBNote } from 'modules/db/interfaces';
import { IStorageData } from './interfaces';
import { Logger } from 'modules/logger/logger';


const logger: Logger = new Logger('cached.ts', 'green');

export class CachedStorage {
  public static cache: IStorageData;
  protected static key = 'cache';

  public static async set(key: string, value: string | number | object | boolean) {
    if (!value && value !== 0 && value !== false) {
      return this.remove([key]);
    }

    this.cache = await this.load(this.key);
    this.cache[key] = { value: value, permanent: false };
    await this.save(this.key, this.cache);
  }

  public static async permanent(key: string, value: string | number | boolean | object) {
    if (!value && value !== 0 && value !== false) {
      return this.remove([key]);
    }

    this.cache = await this.load(this.key);
    this.cache[key] = { value: value, permanent: true };
    await this.save(this.key, this.cache);
  }

  public static async get(keys?: string[]): Promise<IStorageData> {
    this.cache = await this.load(this.key);

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
    this.cache = await this.load(this.key);
    const keys: string[] = Object.keys(this.cache);

    for (let i = 0; i < keys.length; i++) {
      const key: string = keys[i];

      if (!this.cache[key].permanent) {
        delete this.cache[key];
      }
    }

    await this.save(this.key, this.cache);
  }

  public static async remove(keys: string[]) {
    this.cache = await this.load(this.key);

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (this.cache[key]) {
        delete this.cache[key];
      }
    }

    await this.save(this.key, this.cache);
  }

  public static async init(list: IDBNote[]) {
    logger.info('set.list', list);

    return this.set('list', list);
  }

  public static async empty() {
    await chrome.storage.local.remove(this.key);
  }

  protected static async save(key: string, value: IStorageData): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  protected static async load(key: string): Promise<IStorageData> {
    const value = (await chrome.storage.local.get(key)) || {};
    
    return value[key] || {};
  }
}