export interface IDBNote {
  id?: number;
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
  deleted?: boolean;
  locked?: boolean;
  inCloud?: boolean;
}

// export interface IDSNote {
//   id?: number;
//   key?: string;
//   data: string;
//   order?: number;
//   sync?: number;
//   preview?: boolean;
//   cState?: string;
//   pState?: string;
//   html?: string;
//   updated?: number;
//   created?: number;
//   deleted?: boolean;
// }

export interface IDBCommand {
  item: IDBNote,
  name: string
}

// export interface ISyncNote {
//   /** 
//    * @field id
//   */
//   i?: number;
//   /** 
//   * @field data
//   */
//   d?: string;
//   /** 
//   * @field order
//   */
//   o?: number;
//   /** 
//   * @field cState
//   */
//   s?: string;
//   /** 
//   * @field updated
//   */
//   u?: number;
//   /** 
//   * @field created
//   */
//   c?: number;
//   /** 
//   * @field rmsync
//   */
//   rmsync?: boolean;
//   /** 
//   * @field chunks number
//   */
//   chunks?: number;
//   test?: number;
// }

// export interface ISyncEvent {
//   db: IDBNote;
//   cloud: ISyncNote;
//   action: string;
// }

// export interface ISyncPair {
//   db: IDBNote;
//   cloud: ISyncNote;
// }

// export interface IPromiseCaller {
//   (resolve: (value: void | PromiseLike<void>) => void, reject: (reason?: any) => void): void;
// };
