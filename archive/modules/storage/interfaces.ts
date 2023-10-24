export interface IStorageValue {
  value: string | number | object | boolean;
  permanent?: boolean;
  sensitive?: boolean;
}

export interface ISyncStorageValue {
  value: string;
  id: number;
}

export interface IStorageData {
  [key: string]: IStorageValue;
}

export interface ISyncStorageData {
  [key: string]: ISyncStorageValue;
}
