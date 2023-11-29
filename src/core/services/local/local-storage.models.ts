export interface IStorageValue<T> {
  value: T | string;
  permanent?: boolean;
  sensitive?: boolean;
}
