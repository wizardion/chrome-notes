import { IDBNote } from 'modules/db';
import { ICachedItem, ICachedItems, IDataDaft } from './models/cached.models';


export class CachedStorageService {
  protected static readonly key = 'cache';
  public static item: ICachedItem;

  public static async set(key: ICachedItems, value: IDBNote | IDataDaft) {
    this.item = this.item || ((await chrome.storage.session.get(this.key) || {})[this.key] || {}) as ICachedItem;

    if (key === 'selected') {
      this.item.selected = <IDBNote> value;
    }

    if (key === 'draft') {
      this.item.draft = <IDataDaft> value;
    }

    await chrome.storage.local.set({ [this.key]: this.item });
    await chrome.storage.session.set({ [this.key]: this.item });
  }

  public static async get<T = ICachedItem>(key?: ICachedItems): Promise<T> {
    this.item = this.item || await this.dump();

    if (key) {
      if (key === 'selected') {
        return this.item.selected as T;
      }

      if (key === 'draft') {
        return this.item.draft as T;
      }
    }

    return this.item as T;
  }

  public static async init() {
    this.item = await this.dump();

    await chrome.storage.local.set({ [this.key]: this.item });
    await chrome.storage.session.set({ [this.key]: this.item });
  }

  public static async dump(): Promise<ICachedItem> {
    this.item = ((await chrome.storage.session.get(this.key) || {})[this.key] || {}) as ICachedItem;

    return this.item;
  }

  public static async remove(keys: ICachedItems[]) {
    this.item = this.item || ((await chrome.storage.session.get(this.key) || {})[this.key] || {}) as ICachedItem;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      if (key === 'selected') {
        delete this.item.selected;
      }

      if (key === 'draft') {
        delete this.item.draft;
      }
    }

    await chrome.storage.local.set({ [this.key]: this.item });
    await chrome.storage.session.set({ [this.key]: this.item });
  }

  public static async clear() {
    await chrome.storage.session.remove(this.key);
    await chrome.storage.local.remove(this.key);
  }
}
