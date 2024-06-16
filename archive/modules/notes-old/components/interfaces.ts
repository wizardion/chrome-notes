import {Editor} from '../../notes/details-view/components/editor/editor';
import {IDBNote} from '../../db/interfaces';
import { Note } from './note';


interface IView {
  node?: HTMLElement;
}

export interface IListView extends IView {
  items?: HTMLElement;

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
  static?: HTMLElement,

  sort?: HTMLInputElement, // Button
  toNote?: HTMLInputElement, // Button
}

export interface Intervals {
  document?: NodeJS.Timeout,
  cursor?: NodeJS.Timeout,
  scroll?: NodeJS.Timeout,
}

export interface IDecorator {
  document?: NodeJS.Timeout;
}

export interface ISTNote extends IDBNote {
  index: number;
}

export interface ICachedNote {
  new: boolean;
  title: string;
  description: string;
  cursor?: string;
  selection?: string;
  previewState?: string;
  preview?: boolean;
}
