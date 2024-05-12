import { IDBNote } from 'modules/db';
import { ListItemElement } from '../../list-item/list-item.component';
import { EditorControlsElement } from '../../editor-controls/editor-controls.component';


export interface IDetailsViewForm {
  head: HTMLElement;
  back: HTMLButtonElement;
  delete: HTMLButtonElement;
  menu: EditorControlsElement;
  menuGroup: HTMLFieldSetElement;
  indicator?: HTMLElement;
  content: HTMLElement;
}

export type IDetailsListenerType =
  | 'cancel'
  | 'delete'
  | 'changed';

export interface IDetailsIntervals {
  changed: NodeJS.Timeout | null;
  locked: NodeJS.Timeout | null;
  delay: number;
}

export interface INote extends IDBNote {
  item?: ListItemElement;
}
