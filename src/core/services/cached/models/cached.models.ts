import { IDBNote } from 'modules/db';


export interface ICachedSettings {
  collapsed: boolean;
}

export interface ICachedItem {
  selected?: IDBNote;
  settings?: ICachedSettings;
}

export type ICachedItems = 'selected' | 'settings';
