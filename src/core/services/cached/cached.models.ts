import { IDBNote } from 'modules/db';


export interface IDataDaft {
  title: string;
  description: string;
  selection?: number[] | null;
}

export interface ICachedItem {
  selected?: IDBNote;
  draft?: IDataDaft;
}

export type ICachedItems = 'selected' | 'draft';
