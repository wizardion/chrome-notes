import { ISyncInfo } from 'modules/sync/components/interfaces';
import { encrypt, decrypt } from 'modules/core';
import { ISyncStorageData, ISyncStorageValue } from './interfaces';


export class SyncStorage {
  protected static key: string = 'syncInfo';

  public static async get(): Promise<ISyncInfo> {
    const data: ISyncStorageValue = (await chrome.storage.sync.get(this.key))[this.key];

    return (
      (data && this.decrypt(data)) || {
        id: null,
        enabled: false,
        token: null,
        encrypted: false,
      }
    );
  }

  public static async decrypt(data: ISyncStorageValue): Promise<ISyncInfo> {
    if (data) {
      const value: ISyncInfo = <ISyncInfo> await decrypt(data.value);

      return {
        id: data.id,
        enabled: value.enabled,
        token: value.token,
        encrypted: value.encrypted,
      };
    }

    return { id: null, enabled: false, token: null, encrypted: false };
  }

  public static async set(value: ISyncInfo): Promise<void> {
    return chrome.storage.sync.set(<ISyncStorageData>{
      [this.key]: {
        id: value.id,
        value: await encrypt({
          enabled: value.enabled,
          token: value.token,
          encrypted: value.encrypted,
        }),
      },
    });
  }

  public static async remove() {
    return chrome.storage.sync.remove(this.key);
  }
}
