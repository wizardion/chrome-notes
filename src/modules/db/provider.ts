import {IDBNote} from './interfaces'
import idb from './idb';
import storage from '../storage/storage';
import {DbNote} from './note';


export function loadFromCache(list?: string): DbNote[] {
  var items = JSON.parse(`[${(list || storage.get('list', true) || '')}]`);
  var notes: DbNote[] = [];

  for (let i = 1; i < items.length; i += 2) {
    const title = items[i - 1];
    const updated = items[i];
    
    notes.push(new DbNote({
      id: 0, 
      title: title, 
      description: '', 
      order: i + 1, 
      updated: updated, 
      created: null,
      sync: null
    }));
  }

  return notes;
}

export function loadAll(callback: Function) {
  var notes: DbNote[] = [];

  idb.load((result: IDBNote[]) => {
    for(var i = 0; i < result.length; i++) {
      notes.push(new DbNote(result[i]));
    }
    
    callback(notes);
  });
}

export function toJSONString(notes: string[]): string {
  // var list: (string|number)[] = [];

  // for (let i = 0; i < Math.min(10, notes.length); i++) {
  //   const note = notes[i];

  //   list = list.concat([note.title, note.updated]);
  // }

  // return JSON.stringify(list).replace(/^\[|\]$/gi, '');

  return '';
}
