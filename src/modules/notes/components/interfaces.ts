import {Editor} from '../editor';


interface IView {
  node?: HTMLElement;
}

export interface IListView extends IView {
  items?: HTMLElement;
  template?: HTMLElement;

  addButton?: HTMLButtonElement;
  searchButton?: HTMLButtonElement;
  searchInput?: HTMLInputElement;
}

export interface INoteView extends IView {
  back?: HTMLButtonElement;
  delete?: HTMLButtonElement;

  editorControlls?: HTMLElement[];
  editor?: Editor;
  preview?: HTMLInputElement;
  sync?: HTMLInputElement;
  html?: HTMLElement;
}

export interface INewNoteView extends IView {
  cancel?: HTMLButtonElement;
  create?: HTMLButtonElement;
}

export interface INoteControls {
  title?: HTMLElement,
  bullet?: HTMLElement,
  date?: HTMLElement,

  sort?: HTMLInputElement, // Button
  toNote?: HTMLInputElement, // Button
}
