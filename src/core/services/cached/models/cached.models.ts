import { IDBNote } from 'modules/db';


export interface ICachedItem {
  selected?: IDBNote;
  popupSize?: number;
}

export type ICachedItems = 'selected';
