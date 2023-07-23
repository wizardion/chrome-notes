import { Base } from 'modules/notes/base';
import storage from 'modules/storage/storage';
import { buildEditor } from './components/builder';
import { parseList } from 'modules/db/provider';
import { DbNote } from 'modules/db/note';
import 'styles/style.scss';
import { ICachedNote } from 'modules/notes/components/interfaces';


var dbNotes: DbNote[] = null;
storage.cached.get().then(async (cache) => {
  var editor: Base = buildEditor(<number>cache.mode?.value || 0);
  var notes: HTMLElement = <HTMLElement>document.getElementById('notes');

  notes.classList.remove('hidden');

  if (cache.new?.value) {
    editor.selectNew(<string>cache.description?.value, <string>cache.selection?.value);
  } else if (cache.selected?.value) {
    editor.selectNote(<ICachedNote>cache.selected.value);
  } else {
    editor.showList();
  }

  if (cache.list?.value) {
    dbNotes = parseList(<(number | string)[]>cache.list.value);
  }

  if (cache.locked) {
    editor.lock = true;
  }

  editor.init(dbNotes);
  notes.classList.remove('transparent');
});
