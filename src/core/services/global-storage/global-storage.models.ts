export interface IGlobalStorageItemType {
  [key: string]: any;
}

export interface IGlobalStorageItem {
  local: IGlobalStorageItemType;
  session: IGlobalStorageItemType;
  sync: IGlobalStorageItemType;
}
