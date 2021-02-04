import {Base} from './modules/notes/base';
import {IControls} from './modules/notes/interfaces';
import './styles/style.scss';
import {fromTextArea} from 'codemirror';

var isNew = localStorage.getItem('new');
var description = localStorage.getItem('description');
var listView: HTMLElement = <HTMLElement>document.getElementById('list-view');
var noteView: HTMLElement = <HTMLElement>document.getElementById('details-view');
var codemirror = fromTextArea(<HTMLTextAreaElement>document.getElementById('description-note'), {
  lineWrapping: true,
  showCursorWhenSelecting: true,
  mode: {
    name: 'gfm'
  }
});

var controls: IControls = {
  listView: {
    node: listView,
    items: <HTMLElement>document.getElementById('list-items'),
    template: <HTMLElement>document.getElementById('template'),
    addButton: <HTMLButtonElement>document.getElementById('add-note'),
    searchButton: <HTMLButtonElement>document.getElementById('search-button'),
    searchInput: <HTMLInputElement>document.getElementById('search-input'),
  },
  noteView: {
    node: noteView,
    back: <HTMLButtonElement>document.getElementById('to-list'),
    delete: <HTMLButtonElement>document.getElementById('delete-note'),
    wrapper: codemirror.getWrapperElement(),
    editor: codemirror
  },
  newView: {
    node: noteView,
    cancel: <HTMLButtonElement>document.getElementById('cancel-note'),
    create: <HTMLButtonElement>document.getElementById('create-note'),
  }
};

var editor = new Base(controls);

if (description) {
  if (isNew) {
    editor.selectNew(description);
  } else {
    editor.showNote(description, true);
  }
} else {
  editor.showList();
}

editor.init();
