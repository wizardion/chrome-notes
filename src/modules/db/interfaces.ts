export interface IDBNote {
  id: number;
  title: string;
  description: string;
  order: number;
  sync: boolean;
  preview: boolean;
  cState: string;
  pState: string;
  html: string;
  updated: number;
  created: number;
}

export interface IDBEvent {
  then: Function,
  result?: any
}

// export interface INote {
//   id: number;
//   title: string;
//   description: string;
//   viewOrder: number;
//   sync: boolean;
//   preview: boolean;
//   updated: number;
//   created: number;
// }