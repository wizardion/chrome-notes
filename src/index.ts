import {ISTNote} from './modules/notes/components/interfaces';
import {Base} from './modules/notes/base';
import storage from './modules/storage/storage';
import {buildEditor, getSelected} from './builder';
import './styles/style.scss';

const mode: number = Number(storage.get('mode', true) || '0');
const isNew = storage.get('new');
const list = storage.get('list', true);
const selected:ISTNote = getSelected(storage.get('selected'));


function redirectToSettingsPage(e: MouseEvent) {
  e.preventDefault();

  storage.set('popupMode', mode);
  window.location.replace(this.href);
}


(() => {
  var notes: HTMLElement = <HTMLElement>document.getElementById('notes');
  var editor: Base = buildEditor(mode);
  var titleLink: HTMLLinkElement = <HTMLLinkElement>document.getElementById('title');

  titleLink.onclick = redirectToSettingsPage;
  // setTimeout(() => editor.init(list), 1);
  notes.style.display = 'inherit';

  if (list) {
    editor.initFromCache(list);
  }

  if (isNew) {
    editor.selectNew(storage.get('description'), storage.get('selection'));
  } else if (selected) {
    editor.selectFromCache(selected);
  } else {
    editor.showList();
  }

  editor.init();

  notes.style.opacity = '1';
})();
