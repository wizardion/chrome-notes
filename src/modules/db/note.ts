import {IDBNote} from './interfaces'
import idb from './idb'

export function loadAll(callback: Function, errorCallback?: Function) {
  var notes: DbNote[] = [];

  idb.load((result: IDBNote[]) => {
    for(var i = 0; i < result.length; i++) {
      notes.push(new DbNote(result[i]));
    }
    
    callback(notes);
  });
}

export class DbNote implements IDBNote {
  public id: number;
  public title: string;
  public description: string;
  public order: number;
  public sync: number;
  public preview: boolean;
  public cState: string;
  public pState: string;
  public html: string;
  public updated: number;
  public created: number;

  constructor(item: IDBNote) {
    this.id = item.id;
    this.title = item.title;
    this.description = item.description;
    this.order = item.order;
    this.updated = item.updated;
    this.created = item.created;

    this.preview = item.preview || null;
    this.cState = item.cState   || null;
    this.pState = item.pState   || null;
    this.html = item.html       || null;
    
    this.sync = (item.sync === undefined || item.sync === null)? 0 : item.sync;
  }

  public static saveQueue() {
    idb.dequeue();
  }

  public save() {
    if (this.id && this.id > 0) {
      idb.update(this);
    } else {
      idb.add(this, this.noteAdded.bind(this));
    }
  }

  public remove() {
    if (this.id && this.id > 0) {
      idb.remove(this.id);
    }
  }
  
  public setOrder() {
    if (this.id && this.id > 0) {
      idb.enqueue(this, 'update');
    }
  }

  public setPreview() {
    if (this.id && this.id > 0) {
      idb.update(this);
    }
    // db.setField('preview', this.preview, this.id);
  }

  public setSync() {
    if (this.id && this.id > 0) {
      idb.update(this);
    }
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
    if (this.id && this.id > 0) {
      idb.update(this);
    }
    // db.setField('html', this.html, this.id);
  }

  public saveCursor() {
    if (this.id && this.id > 0) {
      idb.update(this);
    }
    // db.setField('cState', this.cState, this.id);
  }

  public savePreviewState() {
    if (this.id && this.id > 0) {
      idb.update(this);
    }
    // db.setField('pState', this.pState, this.id);
  }

  private noteAdded(id: number){
    this.id = id;
  }
}
