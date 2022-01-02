import {IDBNote} from './interfaces'
import idb from './idb';


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
  }

  public setSync() {
    if (this.id && this.id > 0) {
      idb.update(this);
    }
  }

  public saveHtml() {
    if (this.id && this.id > 0) {
      idb.update(this);
    }
  }

  public saveCursor() {
    if (this.id && this.id > 0) {
      idb.update(this);
    }
  }

  public savePreviewState() {
    if (this.id && this.id > 0) {
      idb.update(this);
    }
  }

  private noteAdded(id: number){
    this.id = id;
  }
}
