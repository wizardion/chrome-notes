import { IDBNote } from '../db/interfaces';
import {ISTNote} from './components/interfaces';


export function fromIDBNoteString(value: string): ISTNote {
  if (value) {
    let note: ISTNote = <ISTNote>JSON.parse(`{${value}}`);

    note.title = note.title || '';
    note.description = note.description || '';

    return note;
  }

  return null;
}

export function toIDBNoteString(selected: IDBNote, index: number = 0): string {
  var note: ISTNote = {
    index: index,
    id: selected.id || undefined,
    title: selected.title || undefined,
    description: selected.description || undefined,
    sync: selected.sync || undefined,
    preview: selected.preview || undefined,
    cState: selected.cState || undefined,
    pState: selected.pState || undefined,
    html: selected.html || undefined,
    updated: selected.updated || undefined,
    order: undefined,
    created: undefined
  };

  return JSON.stringify(note).replace(/^\{|\}$/gi, '');
}