import {IDBNote} from "../db/interfaces";


// export interface IDBCommand {
//   item: IDBNote,
//   name: string
// }

// TODO review 
export interface ISyncNote {
  /** 
   * @field id
  */
  i?: number;
  /** 
  * @field data
  */
  d?: string;
  /** 
  * @field order
  */
  o?: number;
  /** 
  * @field cState
  */
  s?: string;
  /** 
  * @field updated
  */
  u?: number;
  /** 
  * @field created
  */
  c?: number;
  /** 
  * @field rmsync
  */
  rmsync?: boolean;
  /** 
  * @field chunks number
  */
  chunks?: number;
  test?: number;
}

export interface ISyncEvent {
  db: IDBNote;
  cloud: ISyncNote;
  action: string;
}

export interface ISyncPair {
  db: IDBNote;
  cloud: ISyncNote;
}

export interface IPromiseDecorator {
  (resolve: (value: void | PromiseLike<void>) => void, reject: (reason?: any) => void): void;
};
