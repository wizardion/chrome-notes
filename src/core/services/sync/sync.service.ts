import { ISyncStorageData, ISyncStorageValue, ISyncInfo } from './models/sync.models';
import { encrypt, decrypt } from 'core';


export class SyncStorageService {
  protected static key: string = 'syncInfo';

  public static async get(): Promise<ISyncInfo> {
    const data: ISyncStorageValue = (await chrome.storage.sync.get(this.key))[this.key];

    return (
      (data && this.decrypt(data)) || {
        token: null,
        enabled: false,
        encrypted: false,
        applicationId: null,
      }
    );
  }

  public static async decrypt(data: ISyncStorageValue): Promise<ISyncInfo> {
    if (data) {
      const value: ISyncInfo = <ISyncInfo> await decrypt(data.value);

      return {
        token: value.token,
        enabled: value.enabled,
        encrypted: value.encrypted,
        applicationId: data.id,
      };
    }

    return { applicationId: null, enabled: false, token: null, encrypted: false };
  }

  public static async set(value: ISyncInfo): Promise<void> {
    return chrome.storage.sync.set(<ISyncStorageData>{
      [this.key]: {
        id: value.applicationId,
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
