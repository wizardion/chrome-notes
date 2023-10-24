
export interface IPReviewState {
  scrollTop: number;
  selection: string;
}

export interface IDBNote {
  id: number;
  title: string;
  description: string;
  order: number;
  synced?: number;
  preview?: boolean;
  cState?: number[] | null;
  pState?: IPReviewState | null;
  html?: boolean;
  updated: number;
  created: number;
  deleted: number;
  locked?: boolean;
}

export type IDBCommandType = 'update' | 'add' | 'remove';

export interface IDBCommand {
  item: IDBNote,
  type: IDBCommandType
}
