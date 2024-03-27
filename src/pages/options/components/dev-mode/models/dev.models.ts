import { IDBNote } from 'modules/db';


export interface IDevSettingsForm {
  fieldset: HTMLFieldSetElement;
  mode: HTMLInputElement;
  print: HTMLLinkElement;
  clean: HTMLLinkElement;
  cacheEmpty: HTMLLinkElement;
  cachePrint: HTMLLinkElement;
  dataPrint: HTMLLinkElement;
  dataRestore: HTMLLinkElement;
  dataEmpty: HTMLLinkElement;
  info: HTMLElement;
}

export interface IDBLogNote extends Omit<IDBNote, 'cState' | 'pState'> {
  cState: string;
  pState: string;
}

export interface IDBParsedData {
  valid: IDBNote[];
  invalid: Partial<IDBNote>[];
}
