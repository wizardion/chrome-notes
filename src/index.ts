import {IListView, INewNoteView, INoteView} from './modules/notes/components/interfaces';
import {Editor} from './modules/notes/editor';
import {Simple} from './modules/notes/simple';
import './styles/style.scss';

var html = localStorage.getItem('html');
var isNew = localStorage.getItem('new');
var selection = localStorage.getItem('selection');
var description = localStorage.getItem('description');
var previewSelection = localStorage.getItem('previewSelection');

document.addEventListener('DOMContentLoaded', () => {
  var listViewElement: HTMLElement = <HTMLElement>document.getElementById('list-view');
  var noteViewElement: HTMLElement = <HTMLElement>document.getElementById('details-view');
  var codemirror = new Editor(
    <HTMLTextAreaElement>document.getElementById('description-note'), 
    <NodeList>document.getElementById('editor-controls').querySelectorAll('div[action]')
  );

  var listView: IListView = {
    node: listViewElement,
    items: <HTMLElement>document.getElementById('list-items'),
    template: <HTMLElement>document.getElementById('template'),
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

  var newView: INewNoteView ={
    node: noteViewElement,
    cancel: <HTMLButtonElement>document.getElementById('cancel-note'),
    create: <HTMLButtonElement>document.getElementById('create-note'),
  }

  var editor = new Simple(listView, noteView, newView);
  editor.init();

  if (description) {
    if (isNew) {
      editor.selectNew(description, selection);
    } else {
      editor.showNote(description, true, selection, !!html, html, previewSelection);
    }    
  } else {
    editor.showList();
  }
});
