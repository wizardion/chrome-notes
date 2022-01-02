import {IListView, INewNoteView, INoteView, ISTNote} from './modules/notes/components/interfaces';
import {Editor} from './modules/notes/editor';
import {Mixed} from './modules/notes/mixed';
import {Base} from './modules/notes/base';
import {Simple} from './modules/notes/simple';
import {Comact} from './modules/notes/compact';
import {FullScreen} from './modules/notes/full-screen';


export function buildEditor(mode: number): Base {
  var listViewElement: HTMLElement = <HTMLElement>document.getElementById('list-view');
  var noteViewElement: HTMLElement = <HTMLElement>document.getElementById('details-view');
  var codemirror = new Editor(
    <HTMLTextAreaElement>document.getElementById('description-note'),
    <NodeList>document.getElementById('editor-controls').querySelectorAll('div[action]')
  );

  var listView: IListView = {
    node: listViewElement,
    items: <HTMLElement>document.getElementById('list-items'),
    addButton: <HTMLButtonElement>document.getElementById('add-note'),
    searchButton: <HTMLButtonElement>document.getElementById('search-button'),
    searchInput: <HTMLInputElement>document.getElementById('search-input'),
  }

  var noteView: INoteView = {
    node: noteViewElement,
    back: <HTMLButtonElement>document.getElementById('to-list'),
    delete: <HTMLButtonElement>document.getElementById('delete-note'),
    preview: <HTMLInputElement>document.getElementById('preview-note'),
    sync: <HTMLInputElement>document.getElementById('sync-note'),
    html: <HTMLElement>document.getElementById('html-preview'),
    editor: codemirror
  };

  var newView: INewNoteView = {
    node: noteViewElement,
    cancel: <HTMLButtonElement>document.getElementById('cancel-note'),
    create: <HTMLButtonElement>document.getElementById('create-note'),
  }

  if (mode === 1) {
    return new Mixed(listView, noteView, newView);
  }

  if (mode === 2) {
    return new Comact(listView, noteView, newView);
  }

  if (mode === 3 || mode === 4) {
    return new FullScreen(listView, noteView, newView);
  }

  return new Simple(listView, noteView, newView);
}

export function getSelected(selected: string): ISTNote {
  if (selected) {
    let note: ISTNote = <ISTNote>JSON.parse(`{${selected}}`);

    note.title = note.title || '';
    note.description = note.description || '';

    return note;
  }

  return null;
}
