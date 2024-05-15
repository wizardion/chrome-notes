import { db, IDBNote } from 'modules/db';


function fromString(text: string): IDBNote[] {
  const matches: string[] = text ? text.match(/[^\0]+/g) : [];
  const result: IDBNote[] = [];

  for (let i = 0; i < matches.length; i++) {
    const values: string[] = matches[i].match(/[^\f]+/g);

    result.push({
      id: new Date().getTime(),
      title: values[0],
      description: !values[1] ? '' : values[1],
      order: i,
      updated: new Date().getTime(),
      created: new Date().getTime(),
      deleted: 0
    });
  }

  return result;
}

export async function migrate(data: string): Promise<boolean> {
  const notes = fromString(data);

  for (let i = 0; i < notes.length; i++) {
    await db.add(notes[i]);
  }

  return !!notes;
}
