import {INoteControls, ISTNote} from './interfaces';
import {DbNote} from '../../db/note';
import { toIDBNoteString } from '../../../builder';


export class Note {
  private controls: INoteControls;
  private note: DbNote;
  private indexId: number;
  private selectionState: string;
  private event?: EventListener;
  public element: HTMLElement;

  constructor(note?: DbNote, index: number = 0) {
    this.note = note || this.createNew(index);
    this.indexId = index;

    this.init();
  }

  public init() {
    this.element = <HTMLElement>document.createElement('div');
    this.controls = {
      title: <HTMLElement>document.createElement('span'),
      bullet: <HTMLElement>document.createElement('span'),
      static: <HTMLElement>document.createElement('span'),
      date: <HTMLElement>document.createElement('span'),
      sort: <HTMLInputElement>document.createElement('input'),
      toNote: <HTMLInputElement>document.createElement('input'),
    };
    
    this.element.className = 'list-item';
    this.controls.date.className = 'date-time';
    this.controls.title.className = 'list-title';
    this.controls.sort.className = 'button sort';
    this.controls.bullet.className = 'list-index';
    this.controls.static.className = 'list-static';
    this.controls.static.innerText = '. ';

    this.controls.sort.type = 'button';
    this.controls.toNote.className = 'button to-note';

    this.element.title = this.note.title;
    this.controls.bullet.innerText = `${(this.indexId + 1)}`;
    this.controls.title.innerText = this.note.title;
    this.controls.date.innerText = this.getDateString(this.note.updated);

    this.element.appendChild(this.controls.toNote);
    this.element.appendChild(this.controls.sort);
    this.element.appendChild(this.controls.bullet);
    this.element.appendChild(this.controls.static);
    this.element.appendChild(this.controls.title);
    this.element.appendChild(this.controls.date);
  }

  public static saveQueue() {
    DbNote.saveQueue();
  }

  public static addEventListener(event: (id: number) => void) {
    DbNote.addEventListener(event);
  }

  public set(note: (DbNote|ISTNote), index: number = null) {
    this.note.id = note.id;
    this.note.description = note.description;
    this.note.order = note.order;
    this.note.sync = note.sync;
    this.note.preview = note.preview;
    this.note.cState = note.cState;
    this.note.pState = note.pState;
    this.note.html = note.html;
    this.note.created = note.created;

    if (index) {
      this.setIndex(index);
    }

    if (this.note.title !== note.title) {
      this.note.title = note.title;
      this.controls.title.innerText = this.note.title;
    }

    if (this.note.updated !== note.updated) {
      this.note.updated = note.updated;
      this.controls.date.innerText = this.getDateString(this.note.updated);
    }
  }

  public setIndex(value: number) {
    if (this.indexId !== value) {
      this.indexId = value;
      this.note.order = value + 1;
      this.controls.bullet.innerText = `${(this.note.order)}`;
    }
  }

  public get id(): number {
    return this.note.id;
  }

  public set index(value: number) {
    if (this.indexId !== value) {
      this.indexId = value;
      this.note.order = value + 1;
      this.controls.bullet.innerText = `${(this.note.order)}`;
      this.note.updated = this.getTime();
      this.note.setOrder();
    }
  }

  public get index(): number {
    return this.indexId;
  }

  public get title(): string {
    return this.note.title;
  }

  public set title(value: string) {
    if (this.note.title !== value) {
      this.note.title = value;
      this.note.updated = this.getTime();
      this.controls.title.innerText = this.note.title;
      this.controls.date.innerText = this.getDateString(this.note.updated);
    }
  }

  public get description(): string {
    return this.note.description;
  }

  public set description(value: string) {
    if (this.note.description !== value) {
      this.note.description = value;
      this.note.updated = this.getTime();
      this.controls.date.innerText = this.getDateString(this.note.updated);
    }
  }

  public get html(): string {
    return this.note.html;
  }

  public set html(value: string) {
    if (this.note.html !== value) {
      this.note.html = value;
      this.note.saveHtml();
    }
  }

  public get cursor(): string {
    return this.note.cState;
  }

  public set cursor(value: string) {
    if (this.note.cState !== value) {
      this.note.cState = value;
      this.note.saveCursor();
    }
  }

  public set selection(value: string) {
    if (this.selectionState !== value) {
      this.selectionState = value;
    }
  }

  public get previewState(): string {
    return this.note.pState;
  }

  public set previewState(value: string) {
    if (this.note.pState !== value) {
      this.note.pState = value;
      this.note.savePreviewState();
    }
  }

  public get preview(): boolean {
    return !!this.note.preview;
  }

  public set preview(value: boolean) {
    this.note.preview = value;
    this.note.setPreview();
  }

  public get sync(): boolean {
    return !!this.note.sync;
  }

  public set sync(value: boolean) {
    this.note.sync = value? true : false;
    this.updated = this.getTime();
    this.note.setSync();
  }

  public get updated(): number {
    return this.note.updated;
  }

  public set updated(value: number) {
    this.note.updated = value;
    this.controls.date.innerText = this.getDateString(this.note.updated);
  }

  public set onclick(event: EventListener) {
    if (this.event) {
      this.element.removeEventListener('mousedown', this.prevent);
      this.element.removeEventListener('click', this.event);
    }

    this.event = event;
    this.element.addEventListener('mousedown', this.prevent);
    this.element.addEventListener('click', this.event);
  }

  public get sortButton(): HTMLInputElement {
    return this.controls.sort;
  }

  public save() {
    this.note.save();
  }

  public remove() {
    this.element.removeEventListener('mousedown', this.prevent);
    this.element.removeEventListener('click', this.event);
    this.element.remove();
    this.note.updated = this.getTime();
    this.note.remove();
  }

  public toString(): string {
    return toIDBNoteString({...this.note, cState: this.selectionState || this.note.cState}, this.index);
  }

  private createNew(index: number): DbNote {
    return new DbNote({
      id: -1, 
      title: '', 
      description: '', 
      order: index + 1, 
      updated: this.getTime(), 
      created: this.getTime(),
      sync: null
    });
  }

  private prevent(e: MouseEvent) {
    e.preventDefault();
  }

  private getTime() {
    return new Date().getTime();
  }

  private getDateString(time: number) {
    return new Date(time).toDateString();
  }
}
