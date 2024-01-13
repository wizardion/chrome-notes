import { IDBNote } from 'modules/db';
import { ListItemElement } from '../list-item/list-item.component';
import { EditorControlsElement } from '../editor-controls/editor-controls.component';


export interface IDetailsViewForm {
  back: HTMLButtonElement;
  cancel: HTMLButtonElement;
  create: HTMLButtonElement;
  delete: HTMLButtonElement;
  menu: EditorControlsElement;
  menuGroup: HTMLFieldSetElement;
  description: HTMLTextAreaElement;
  head: HTMLElement;
  content: HTMLElement;
  preview: HTMLElement;
  previewer: HTMLPreElement;
}

// export interface IMarkdownViewForm {
//   back: HTMLButtonElement;
//   cancel: HTMLButtonElement;
//   create: HTMLButtonElement;
//   delete: HTMLButtonElement;
//   menu: EditorControlsElement;
//   menuGroup: HTMLFieldSetElement;
//   description: HTMLTextAreaElement;
//   head: HTMLElement;
//   content: HTMLElement;
//   preview: HTMLElement;
//   previewer: HTMLPreElement;
// }

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
