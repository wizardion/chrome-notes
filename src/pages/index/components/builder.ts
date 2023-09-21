import {IListView, INewNoteView, INoteView, ISTNote} from 'modules/notes/components/interfaces';
import {Editor} from 'modules/notes2/components/editor/editor';
import {Base} from 'modules/notes/base';
import {Screen} from 'modules/notes/screen';


export function buildEditor(): Base {
  const listViewElement: HTMLElement = <HTMLElement>document.getElementById('list-view');
  const noteViewElement: HTMLElement = <HTMLElement>document.getElementById('details-view');
  const codemirror = new Editor(
    <HTMLTextAreaElement>document.getElementById('description-note'),
    <NodeList>document.getElementById('editor-controls').querySelectorAll('div[action]')
  );

  const listView: IListView = {
    node: listViewElement,
    items: <HTMLElement>document.getElementById('list-items'),
    addButton: <HTMLButtonElement>document.getElementById('add-note'),
    searchButton: <HTMLButtonElement>document.getElementById('search-button'),
    searchInput: <HTMLInputElement>document.getElementById('search-input'),
  };

  const noteView: INoteView = {
    node: noteViewElement,
    back: <HTMLButtonElement>document.getElementById('to-list'),
    delete: <HTMLButtonElement>document.getElementById('delete-note'),
    preview: <HTMLInputElement>document.getElementById('preview-note'),
    html: <HTMLElement>document.getElementById('html-preview'),
    editor: codemirror
  };

  const newView: INewNoteView = {
    node: noteViewElement,
    cancel: <HTMLButtonElement>document.getElementById('cancel-note'),
    create: <HTMLButtonElement>document.getElementById('create-note'),
  };

  return new Screen(listView, noteView, newView);
}
