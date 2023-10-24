export interface IStorageValue {
  value: string | number | object | boolean;
  permanent?: boolean;
  sensitive?: boolean;
}

export interface IStorageData {
  [key: string]: IStorageValue;
}
