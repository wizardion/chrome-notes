import idb from '../db/idb';
import {IDBNote} from '../db/interfaces';


export function migrate(data: string): boolean {
  var notes = fromString(data);
  
  for(var i = 0; i < notes.length; i++){
      idb.add(notes[i]);
  }

  return !!notes;
}

function fromString(text: string): IDBNote[] {
  var matches: string[] = text? text.match(/[^\0]+/g) : [];
  var result: IDBNote[] = [];
  
  for(let i = 0; i < matches.length; i++){
      var values: string[] = matches[i].match(/[^\f]+/g);

      result.push({
        id: 1,
        title: values[0],
        description: !values[1]? "" : values[1],
        order: i,
        updated: new Date().getTime(),
        created: new Date().getTime(),
      });
  }

  return result;
}
