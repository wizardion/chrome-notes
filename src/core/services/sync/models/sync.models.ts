
export interface ISyncInfo {
  token: string;
  fileId: string;
  enabled: boolean;
  encrypted: boolean;
  applicationId: number;
}

export interface ISyncStorageValue {
  value: string;
  id: number;
}

export interface ISyncStorageData {
  [key: string]: ISyncStorageValue;
}
