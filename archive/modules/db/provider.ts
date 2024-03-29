import * as idb from './idb';
import {DbNote} from './note';
import {IDBNote} from './interfaces';
import { Note } from 'modules/notes-old/components/note';
import { ICachedNote } from 'modules/notes-old/components/interfaces';


export async function loadAll(): Promise<DbNote[]> {
  const notes: DbNote[] = [];
  const result: IDBNote[] = await idb.load();

  for (let i = 0; i < result.length; i++) {
    const item = result[i];

    if (!item.deleted && !item.locked) {
      notes.push(new DbNote(item));
    }
  }

  return notes;
}

export function parseList(list: (number | string)[]): DbNote[] {
  const result: DbNote[] = [];

  for (let i = 0; i < list.length; i += 3) {
    result.push(
      new DbNote({
        id: <number>list[i],
        description: '',
        order: i,
        title: <string>list[i + 1],
        updated: <number>list[i + 2],
        created: 0,
      })
    );
  }

  return result;
}

// export function toNote(value: ICachedNote): Note {
//   // const splited = value.split('\n\n');
//   // const title = splited.shift();
//   // const description = splited.join('\n\n');

//   // return new Note(
//   //   new DbNote({
//   //     id: -1,
//   //     description: description,
//   //     order: 0,
//   //     title: title,
//   //     updated: 0,
//   //     created: 0,
//   //   })
//   // );
// }
