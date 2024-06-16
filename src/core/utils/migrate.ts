import { db, IDBNote } from 'modules/db';
import { delay } from '..';


async function fromString(text: string): Promise<IDBNote[]> {
  const matches: string[] = text ? text.match(/[^\0]+/g) : [];
  const result: IDBNote[] = [];

  for (let i = 0; i < matches.length; i++) {
    const values: string[] = matches[i].match(/[^\f]+/g);
    const time = new Date().getTime();
    const title = values[0];

    result.push({
      id: time,
      title: title || '',
      description: values[1] ? (title ? `# ${title}\n\n` : '') + values[1] : (title ? `# ${title}\n\n` : ''),
      order: i,
      updated: time,
      created: time,
      deleted: 0
    });

    await delay(50);
  }

  return result;
}

export async function migrate(data: string): Promise<boolean> {
  const notes = await fromString(data);

  for (let i = 0; i < notes.length; i++) {
    await db.add(notes[i]);
    await delay(10);
  }

  const dbNotes = await db.dump();

  if (dbNotes.length !== notes.length) {
    throw Error('Not all notes were migrated. Please review the data if you want to restore it.');
  }

  localStorage.clear();
  chrome.storage.local.remove(['migrate', 'oldNotes']);

  return true;
}
