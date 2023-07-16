export interface IDBNote {
  id: number;
  title: string;
  description: string;
  order: number;
  synced?: number;
  preview?: boolean;
  cState?: string;
  pState?: string;
  html?: string;
  updated: number;
  created: number;
  deleted?: boolean;
  locked?: boolean;
}

export interface IDBCommand {
  item: IDBNote,
  name: string
}
