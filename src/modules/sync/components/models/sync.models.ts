import { IDBNote } from 'modules/db';


export type ISyncRequest<T> = (identityInfo?: IdentityInfo) => Promise<T>;


//#region local-storage: sensitive
export interface IdentityInfo {
  fileId: string;
  token: string;
  passphrase: string;
  encrypted: boolean;
  enabled: boolean;
  locked?: boolean;
  applicationId?: number;
}

export interface IPasswordRule {
  count: number;
  modified: number;
}
//#endregion

//#region Drive
export interface ISyncPair {
  db: IDBNote;
  cloud: ISyncItemInfo;
}

export interface ILockInfo {
  title?: string;
  description?: string;
}

export interface ISyncItemInfo {
  /**
   * @field id
  */
  i: number;
  /**
* @field title
*/
  t?: string;
  /**
  * @field description
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
  * @field preview
  */
  p?: boolean;
  /**
  * @field pState
  */
  e?: string | null;
}

export interface ICloudInfo {
  modified: number;
  secret?: string;
  rules: string;
  items: ISyncItemInfo[];
  changed?: boolean;
}

export interface IFileInfo {
  id: string;
  modifiedTime: string;
  trashed: boolean;
  isNew?: boolean;
  data?: ICloudInfo;
}

export interface IMemInfo {
  file: IFileInfo
}

export enum DriveSettings {
  FOLDER_NAME = 'My-Work-Notes',
  FILE_NAME = 'my-notes.data.json',
  FILE_GET_API = 'https://www.googleapis.com/drive/v3/files',
  FILE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files',
  FILE_FIELDS = 'id,name,modifiedTime,trashed',
  QUERY_FIELDS = 'files/id,files/name,files/modifiedTime,files/trashed'
}
//#endregion

//#region Exertions
export class TokenError extends Error {
  message: string;
  status: number;

  constructor(message: string = 'Invalid authentication credentials') {
    super(message);
    this.message = message;
  }
}

export class TokenExpired extends TokenError {
  constructor(message: string = 'Token Expired') {
    super(message);
    this.message = message;
  }
}

export class TokenSecretDenied extends TokenError {
  constructor(message: string = 'Invalid encryption passphrase') {
    super(message);
    this.message = message;
  }
}

export class IntegrityError extends TokenError {
  constructor(message: string) {
    super(message);
    this.message = message;
  }
}
//#endregion
