import { IDBNote } from 'modules/db/interfaces';


export { IDBNote } from 'modules/db/interfaces';

export interface IDataDaft {
  title: string;
  description: string;
  selection?: number[] | null;
}

export interface IPopupData {
  index?: number;
  selected: IDBNote;
  draft: IDataDaft;
}
