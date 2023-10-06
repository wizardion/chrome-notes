// import {Base} from 'modules/notes/base';
// import storage from 'modules/storage/storage';
// import {buildEditor} from './components/builder';
// import { DbNote } from 'modules/db/note';
// import { parseList } from 'modules/db/provider';
// import 'styles/style.scss';


// var dbNotes: DbNote[] = null;
// storage.cached.get().then(cache => {
//   var notes: HTMLElement = <HTMLElement>document.getElementById('notes');
//   var editor: Base = buildEditor();
  
//   notes.classList.remove('hidden');

//   if (cache.new && cache.new.value) {
//     // editor.selectNew(<string>(cache.description && cache.description.value), <string>(cache.selection && cache.selection.value));
//   } else if (cache.selected && cache.selected.value) {
//     // editor.selectFromCache(fromIDBNoteString(<string>cache.selected.value));
//   } else {
//     editor.showList();
//   }

//   if (cache.list?.value) {
//     dbNotes = parseList(<(number | string)[]>cache.list.value);
//   }

//   if (cache.locked) {
//     editor.lock = true;
//   }

//   editor.init();
//   notes.classList.remove('transparent');
// });
