export interface IWindow {
  top: number;
  left: number;
  width: number;
  height: number;
}

export type StorageChange = { [key: string]: chrome.storage.StorageChange };
export type AreaName = chrome.storage.AreaName;
