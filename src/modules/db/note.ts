import {IDBNote} from './interfaces'
import idb from './idb'

export class DbNote implements IDBNote {
  public id: number;
  public title: string;
  public description: string;
  public order: number;
  public sync: boolean;
  public preview: boolean;
  public cState: string;
  public pState: string;
  public html: string;
  public updated: number;
  public created: number;
  public testW: number = 123;

  constructor(id: number, title: string, description: string, viewOrder: number,
    updated: number, created: number, sync: boolean = false, preview: boolean = false,
    cState?: string, pState?: string, html?: string) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.order = viewOrder;
    this.updated = updated;
    this.created = created;
    this.sync = sync;
    this.preview = preview;
    this.cState = cState;
    this.pState = pState;
    this.html = html;
  }

  private static initNotes(result: IDBNote[]): DbNote[] {
    var notes: DbNote[] = [];

    // console.log('initNotes', result);

    for (var i = 0; i < result.length; i++) {
      const note: IDBNote = result[i];
      console.log('initNote', note);
      // notes.push(new DbNote(
      //   note.id,
      //   note.title,
      //   note.description,
      //   note.order,
      //   note.updated,
      //   note.created,
      //   note.sync,
      //   note.preview,



      //   // result.rows.item(i)['id'],
      //   // result.rows.item(i)['title'],
      //   // result.rows.item(i)['description'],
      //   // result.rows.item(i)['viewOrder'],
      //   // result.rows.item(i)['updated'],
      //   // result.rows.item(i)['created'],
      //   // <boolean>(result.rows.item(i)['sync'] === 'true'),
      //   // <boolean>(result.rows.item(i)['preview'] === 'true'),
      //   // result.rows.item(i)['cState'],
      //   // result.rows.item(i)['pState'],
      //   // result.rows.item(i)['html']
      // ));
    }

    // for (var i = 0; i < result.rows.length; i++) {
    //   notes.push(new DbNote(
    //     result.rows.item(i)['id'],
    //     result.rows.item(i)['title'],
    //     result.rows.item(i)['description'],
    //     result.rows.item(i)['viewOrder'],
    //     result.rows.item(i)['updated'],
    //     result.rows.item(i)['created'],
    //     <boolean>(result.rows.item(i)['sync'] === 'true'),
    //     <boolean>(result.rows.item(i)['preview'] === 'true'),
    //     result.rows.item(i)['cState'],
    //     result.rows.item(i)['pState'],
    //     result.rows.item(i)['html']
    //   ));
    // }

    return notes;
  }

  public static loadAll(callback: Function, errorCallback?: Function) {
    var notes: DbNote[] = [];

    idb.load((result: IDBNote[]) => {
      notes = DbNote.initNotes(result);
      callback(notes);
    });
  }

  // public static loadSync(callback: Function, errorCallback?: Function) {
  //   var notes: DbNote[] = [];

  //   db.loadSync(function (result: SQLResultSet) {
  //     notes = DbNote.initNotes(result);
  //     callback(notes);
  //   });
  // }

  public static saveQueue() {
    idb.saveQueue();
  }

  public save() {
    if (this.id && this.id > 0) {
      // db.update(this, function(){});
    } else {
      idb.add(this, this.noteAdded.bind(this));
    }
  }

  public remove() {
    // db.remove(this.id, function () { });
  }

  public setOrder() {
    // db.setOrder(this);
  }

  public setPreview() {
    // db.setField('preview', this.preview, this.id);
  }

  public setSync() {
    // db.setField('sync', this.sync, this.id);

    // var hashCode = function(s: string) {
    //   let h = 0;
    //   for(let i = 0; i < s.length; i++) 
    //         h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    //   return h;
    // };

    // console.warn('saved sync', {sync: this.sync, title: this.title, hash: hashCode(this.title)});

    

    // // chrome.storage.sync.set({key: value}, function() {
    // //   console.log('Value is set to ' + value);
    // // });
  }

  public saveHtml() {
    // db.setField('html', this.html, this.id);
  }

  public saveCursor() {
    // db.setField('cState', this.cState, this.id);
  }

  public savePreviewState() {
    // db.setField('pState', this.pState, this.id);
  }

  private noteAdded(id: number){
    this.id = id;

    console.log('noteAdded', {'id': id});
  }
}
