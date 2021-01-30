import {Editor} from 'codemirror';

export interface IControls {
  listView?: IListView;
  noteView?: INoteView;
  newView?: INewNoteView;
}

interface IView {
  node?: HTMLElement;
}

interface IListView extends IView {
  items?: HTMLElement;

  addButton?: HTMLButtonElement;
  searchButton?: HTMLButtonElement;
  searchInput?: HTMLInputElement;
}

interface INoteView extends IView {
  back?: HTMLButtonElement;
  delete?: HTMLButtonElement;

  editorControlls?: HTMLElement[];
  wrapper?: HTMLElement;
  editor?: Editor;
}

interface INewNoteView extends IView {
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
