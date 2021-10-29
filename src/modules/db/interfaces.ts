export interface IDBNote {
  id: number;
  title: string;
  description: string;
  order: number;
  sync?: number;
  preview?: boolean;
  cState?: string;
  pState?: string;
  html?: string;
  updated: number;
  created: number;
}

export interface IDBCommand {
  item: IDBNote,
  name: string
}
