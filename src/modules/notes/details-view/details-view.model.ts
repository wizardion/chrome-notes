import { IDBNote } from 'modules/db';
import { ListItemElement } from '../list-item/list-item.component';


export interface IDetailsViewForm {
  back: HTMLButtonElement;
  cancel: HTMLButtonElement;
  create: HTMLButtonElement;
  delete: HTMLButtonElement;
  preview: HTMLInputElement;
  formatters: NodeList;
  previewer: HTMLPreElement;
  description: HTMLTextAreaElement;
}

export type IEventListenerType =
  | 'back'
  | 'delete'
  | 'cancel'
  | 'change'
  | 'create'
  | 'preview'
  | 'save'
  | 'selectionchange';

export interface IDetailsIntervals {
  changed: NodeJS.Timeout | null;
  locked: NodeJS.Timeout | null;
  delay: number;
}

export interface INote extends IDBNote {
  item?: ListItemElement;
}
