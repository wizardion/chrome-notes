export interface IWindow {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface IWorkerInfo {
  id: number;
  worker: string;
}

export interface IPushInfo {
  pushInfo: number;
}

export interface ISyncPushInfo {
  id: number;
  time: number;
}

export type StorageChange = { [key: string]: chrome.storage.StorageChange };
export type AreaName = chrome.storage.AreaName;

export class TerminateProcess extends Error {
  message: string;
  worker: string;

  constructor(worker: string, message: string = 'Terminate process') {
    super(message);
    this.message = message;
    this.worker = worker;
  }
}
