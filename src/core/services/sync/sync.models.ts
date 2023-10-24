
export interface ISyncInfo {
  id: number;
  enabled: boolean;
  token: string;
  encrypted: boolean;
}

export interface ISyncStorageValue {
  value: string;
  id: number;
}

export interface ISyncStorageData {
  [key: string]: ISyncStorageValue;
}
