import {IControls} from './modules/notes/components/interfaces';
import {Editor} from './modules/notes/editor';
import {Base} from './modules/notes/base';
import './styles/style.scss';

var isNew = localStorage.getItem('new');
var selection = localStorage.getItem('selection');
var description = localStorage.getItem('description');

document.addEventListener('DOMContentLoaded', () => {
  var listView: HTMLElement = <HTMLElement>document.getElementById('list-view');
  var noteView: HTMLElement = <HTMLElement>document.getElementById('details-view');
  var codemirror = new Editor(
    <HTMLTextAreaElement>document.getElementById('description-note'), 
    <NodeList>document.getElementById('editor-controlls').querySelectorAll('div[action]')
  );

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
      preview: <HTMLButtonElement>document.getElementById('preview-note'),
      html: <HTMLElement>document.getElementById('html-preview'),
      editor: codemirror
    },
    newView: {
      node: noteView,
      cancel: <HTMLButtonElement>document.getElementById('cancel-note'),
      create: <HTMLButtonElement>document.getElementById('create-note'),
    }
  };

  var editor = new Base(controls);
  editor.init();

  if (description) {
    if (isNew) {
      editor.selectNew(description, selection);
    } else {
      editor.showNote(description, true, selection);
    }    
  } else {
    editor.showList();
  }
});
