import { IStorageValue, IStorageData } from "./interfaces";
import {encrypt, decrypt} from 'modules/core';


export class LocalStorage {
  public static async get(key: string, defaults: any = null): Promise<object | number | boolean> {
    var data = await chrome.storage.local.get(key);

    if (data[key] && data[key].sensitive && data[key].value) {
      return this.decrypt(data[key]);
    }

    return data[key] || defaults;
  }

  public static async decrypt(data: IStorageValue): Promise<object> {
    return data && data.value && decrypt(<string>data.value);
  }

  public static async set(key: string, value: object | number | string | boolean): Promise<void> {

    if (key === 'errorMessage') {
      console.log('value', value);
    }

    return chrome.storage.local.set({ [key]: value });
  }

  public static async sensitive(key: string, value: object): Promise<void> {
    return chrome.storage.local.set(<IStorageData>{
      [key]: { sensitive: true, value: await encrypt(value) },
    });
  }

  public static async remove(key: string) {
    return chrome.storage.local.remove(key);
  }
}
