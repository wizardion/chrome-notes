
class CachedStorage {
  // private static storage: Storage = (typeof(localStorage) !== 'undefined') && localStorage;
  private static storage: Storage = null;

  public static async set(key: string, value: (string|number|object), permanent: boolean = false) {
    if (!value && value !== 0) {
      return this.remove(key);
    }

    let cache = (await chrome.storage.local.get('cache') || {}).cache || {};
    cache[key] = {value: value, permanent: permanent};
    await chrome.storage.local.set({cache: cache});
    this.storage && this.storage.setItem('cache', JSON.stringify(cache));
  }

  public static async get(key?: string): Promise<{[key: string]: {value: any, permanent: boolean}}> {
    let cache = this.storage? JSON.parse(this.storage.getItem('cache') || '{}') : 
        (await chrome.storage.local.get('cache') || {}).cache || {};

    if (key) {
      return {[key]: cache[key] || {value: null, permanent: null}};
    }

    return cache;
  }

  public static async clear(permanent?: boolean) {
    if (!permanent) {
      let cache = (await chrome.storage.local.get('cache') || {}).cache || {};
      var keys: string[] = Object.keys(cache);
  
      for(let i = 0; i < keys.length; i++) {
        const key: string = keys[i];
  
        if (!cache[key].permanent) {
          delete cache[key];
        }
      }

      await chrome.storage.local.set({cache: cache});
      this.storage && this.storage.setItem('cache', JSON.stringify(cache));
      return;
    }

    await chrome.storage.local.remove('cache');
    this.storage && this.storage.removeItem('cache');
  }

  public static async remove(key: string) {
    let cache = (await chrome.storage.local.get('cache') || {}).cache || {};

    if (cache[key]) {
      delete cache[key];
    }
    
    await chrome.storage.local.set({cache: cache});
    this.storage && this.storage.setItem('cache', JSON.stringify(cache));
  }
}

export default {
  cached: CachedStorage
};
