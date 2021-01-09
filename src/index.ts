import './style.css';
import {DbNote} from './modules/db/note'

var editor = document.getElementById('editor');

DbNote.loadAll(function (notes: DbNote[]) {
  for (let i = 0; i < notes.length; i++) {
    let div = document.createElement('div');
    const note = notes[i];

    div.innerText = `${note.id} - ${note.title}`;
    editor.appendChild(div);
  }

  let first = notes[0];

  first.save();
});
