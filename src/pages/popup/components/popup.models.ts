import { IDBNote } from 'modules/db/interfaces';


export interface IDataDaft {
  title: string;
  description: string;
  selection?: number[] | null;
}

export interface IPopupData {
  items: IDBNote[];
  index: number;
  draft: IDataDaft;
}
