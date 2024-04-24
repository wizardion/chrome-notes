import { IStorageValue } from 'core/services/local/models/local-storage.models';


export interface IDBNote {
  id: number;
  title: string;
  description: string;
  order: number;
  updated: number;
  created: number;
  deleted: number;
  locked?: boolean;
  synced?: number;
  preview?: boolean;
  cState?: number[] | null;
  pState?: string | null;
  push?: boolean;
}

export type IDBCommandType = 'update' | 'add' | 'remove';

export interface IDBCommand {
  item: IDBNote,
  type: IDBCommandType
}

export interface IStoragePushInfo {
  pushInfo: number
}

export interface IStorageIdentityInfo {
  identityInfo: IStorageValue<string>
}
