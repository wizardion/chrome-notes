import {IDBNote} from './interfaces'
import * as idb from './idb';

var onNoteAdded: (id: number) => void;

export class DbNote implements IDBNote {
  public id: number;
  public title: string;
  public description: string;
  public order: number;
  public synced: number;
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
  }

  public static saveQueue() {
    idb.dequeue();
  }

  public save() {
    if (this.id && this.id > 0) {
      idb.update(this.toDBNote());
    } else {
      idb.add(this.toDBNote()).then(this.noteAdded.bind(this));
    }
  }

  public remove() {
    if (this.id && this.id > 0) {
      let item: IDBNote = this.toDBNote();

      item.deleted = true;
      idb.update(item);
    }
  }
  
  public setOrder() {
    if (this.id && this.id > 0) {
      idb.enqueue(this.toDBNote(), 'update');
    }
  }

  public setPreview() {
    if (this.id && this.id > 0) {
      idb.update(this.toDBNote());
    }
  }

  public setSync() {
    if (this.id && this.id > 0) {
      idb.update(this.toDBNote());
    }
  }

  public saveHtml() {
    if (this.id && this.id > 0) {
      idb.update(this.toDBNote());
    }
  }

  public saveCursor() {
    if (this.id && this.id > 0) {
      idb.update(this.toDBNote());
    }
  }

  public savePreviewState() {
    if (this.id && this.id > 0) {
      idb.update(this.toDBNote());
    }
  }

  private async noteAdded(id: number){
    this.id = id;

    if (onNoteAdded)  {
      onNoteAdded(id);
    }
  }

  public static addEventListener(event: (id: number) => void) {
    onNoteAdded = event;
  }

  private toDBNote(): IDBNote {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      order: this.order,
      preview: this.preview,
      cState: this.cState,
      pState: this.pState,
      html: this.html,
      updated: this.updated,
      created: this.created,
      deleted: false
    };
  }
}
