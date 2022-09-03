import idb from './idb';
import {DbNote} from './note';
import {IDBNote} from './interfaces'


export function loadFromCache(list?: string): DbNote[] {
  var items = list? JSON.parse(`[${list}]`) : [];
  var notes: DbNote[] = [];

  for (let i = 2; i < items.length; i += 3) {
    const id = items[i - 2];
    const title = items[i - 1];
    const updated = items[i];
    
    notes.push(new DbNote({
      id: id, 
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
      const item = result[i];

      if (!item.deleted && !item.locked) {
        notes.push(new DbNote(item));
      }
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
