import {INote} from './interfaces'
import db from './db'

export class DbNote implements INote {
  public id: number;
  public title: string;
  public description: string;
  public viewOrder: number;
  public sync: boolean;
  public preview: boolean;
  public cState: string;
  public pState: string;
  public html: string;
  public updated: number;
  public created: number;

  constructor(id: number, title: string, description: string, viewOrder: number,
    updated: number, created: number, sync: boolean = false, preview: boolean = false,
    cState?: string, pState?: string, html?: string) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.viewOrder = viewOrder;
    this.updated = updated;
    this.created = created;
    this.sync = sync;
    this.preview = preview;
    this.cState = cState;
    this.pState = pState;
    this.html = html;
  }

  public static loadAll(callback: Function, errorCallback?: Function) {
    var notes: DbNote[] = [];

    db.load(function (result: SQLResultSet) {
      for (var i = 0; i < result.rows.length; i++) {
        notes.push(new DbNote(
          result.rows.item(i)['id'],
          result.rows.item(i)['title'],
          result.rows.item(i)['description'],
          result.rows.item(i)['viewOrder'],
          result.rows.item(i)['updated'],
          result.rows.item(i)['created'],
          <boolean>(result.rows.item(i)['sync'] === 'true'),
          <boolean>(result.rows.item(i)['preview'] === 'true'),
          result.rows.item(i)['cState'],
          result.rows.item(i)['pState'],
          result.rows.item(i)['html']
        ));
      }

      callback(notes);
    });
  }

  public static saveQueue() {
    db.saveQueue(function () {});
  }

  public save() {
    if (this.id && this.id > 0) {
      db.update(this, function(){});
    } else {
      db.add(this, this.noteAdded.bind(this));
    }
  }

  public remove() {
    db.remove(this.id, function () { });
  }

  public setOrder() {
    db.setOrder(this);
  }

  public setPreview() {
    db.setField('preview', this.preview, this.id);
  }

  public setSync() {
    db.setField('sync', this.sync, this.id);
  }

  public saveHtml() {
    db.setField('html', this.html, this.id);
  }

  public saveCursor() {
    db.setField('cState', this.cState, this.id);
  }

  public savePreviewState() {
    db.setField('pState', this.pState, this.id);
  }

  private noteAdded(result: SQLResultSet){
    if (result.insertId) {
      this.id = result.insertId;
    }
  }
}