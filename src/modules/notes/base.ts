import { ICachedNote, IListView, INewNoteView, INoteView, Intervals, ISTNote } from './components/interfaces';
import { DbNote } from '../db/note';
import { loadAll, parseList } from '../db/provider';
import { Note } from './components/note';
import { Validator } from './components/validation';
import { Sorting } from './components/sorting';
import { ScrollListener } from './components/scrolling';
import { NodeHelper } from './components/node-helper';
import storage from '../storage/storage';
import { Logger } from '../logger/logger';

const logger: Logger = new Logger('base.ts', 'red');
export class Base {
  protected notes: Note[];
  protected _selected?: Note;
  protected intervals: Intervals;
  protected listView: IListView;
  protected noteView: INoteView;
  protected newView: INewNoteView;
  private cacheIndex?: number;
  protected new?: boolean;
  protected _locked: boolean;

  constructor(listView: IListView, noteView: INoteView, newView: INewNoteView) {
    this.notes = [];
    this.intervals = {};
    this._selected = null;
    this.listView = listView;
    this.noteView = noteView;
    this.newView = newView;
    this._locked = false;
  }

  // public selectFromCache(note: ISTNote) {
  //   if (note.index !== null && this.notes.length > 0 && note.index < this.notes.length) {
  //     var selected = this.notes[note.index];

  //     selected.set(note);
  //     return this.selectNote(selected, true);
  //   }

  //   this.cacheIndex = note.index;
  //   this.showNote();
  //   this.bind((note.title || '') + '\n' + (note.description || ''), note.cState, note.html, note.pState);
  // }

  public async init(list?: DbNote[]) {
    if (list && list.length) {
      this.listView.items.appendChild(this.render(list));
    }

    this.build(await loadAll());
  }

  get selected(): Note {
    return this._selected;
  }

  set selected(value: Note) {
    this._selected = value;
  }

  private render(items: DbNote[]) {
    var index: number = -1;
    var fragment = <DocumentFragment>document.createDocumentFragment();

    for (var i = 0; i < items.length; i++) {
      const item = items[i];
      const note = this.notes[i];

      index++;

      if (!note) {
        const newNote = new Note(item, index);

        this.notes.push(newNote);
        fragment.appendChild(newNote.element);

        newNote.onclick = this.selectNote.bind(this, newNote, true, true);
        newNote.sortButton.onmousedown = Sorting.start.bind(Sorting, newNote);
      } else if (item.id !== note.id) {
        const newNote = new Note(item, index);

        this.notes.splice(i, 0, newNote);
        this.listView.items.insertBefore(newNote.element, note.element);

        newNote.onclick = this.selectNote.bind(this, newNote, true, true);
        newNote.sortButton.onmousedown = Sorting.start.bind(Sorting, newNote);
      } else {
        note.set(item, index);
      }
    }

    return fragment;
  }

  /**
   * Builds and binds all events from db notes. This method calls asynchronously.
   * @memberof Base
   * @name build
   * @param {DbNote[]} notes
   * @returns {void}
   */
  protected build(notes: DbNote[]): void {
    if (notes.length > 0) {
      this.listView.items.appendChild(this.render(notes));

      Sorting.notes = this.notes;
      Sorting.items = this.listView.items;
      Sorting.onEndSorting = this.cacheList.bind(this);

      if (!this.selected && this.cacheIndex >= 0 && this.notes.length) {
        this.selectNote(this.notes[this.cacheIndex]);
      } else if (this.selected) {
        let selected: Note = this.selected;
        let value = selected.title + '\n' + selected.description;

        if (this.noteView.editor.value !== value) {
          this.bind(value, selected.cursor, selected.html, selected.previewState, selected.cached);
        }
      }
    }

    this.listView.addButton.addEventListener('mousedown', this.preventClick.bind(this));
    this.noteView.back.addEventListener('mousedown', this.preventClick.bind(this));
    this.noteView.delete.addEventListener('mousedown', this.preventClick.bind(this));
    this.noteView.preview.parentElement.addEventListener('mousedown', this.preventClick.bind(this));
    this.newView.create.addEventListener('mousedown', this.preventClick.bind(this));
    this.newView.cancel.addEventListener('mousedown', this.preventClick.bind(this));

    this.listView.addButton.addEventListener('click', () => this.selectNew());
    this.noteView.delete.addEventListener('click', this.remove.bind(this));
    this.noteView.preview.addEventListener('click', this.togglePreview.bind(this));
    this.newView.create.addEventListener('click', this.addNote.bind(this));
    this.newView.cancel.addEventListener('click', this.cancelCreation.bind(this));
    // this.noteView.html.addEventListener('scroll', this.previewStateChanged.bind(this));

    document.addEventListener('selectionchange', this.previewStateChanged.bind(this));

    this.noteView.editor.on('change', this.descriptionChanged.bind(this));
    this.noteView.editor.on('cursorActivity', this.cursorMoved.bind(this));
    this.noteView.editor.on('save', this.saveHandler.bind(this));
    this.noteView.editor.on('cancel', this.cancelHandler.bind(this));

    ScrollListener.listen(this.listView.items, 550);
    ScrollListener.listen(this.noteView.editor.scroll, 550);
    ScrollListener.listen(this.noteView.html, 550);
    Note.addEventListener(this.onNewNoteCreated.bind(this));

    this.cacheList(notes);
  }

  //#region Event-Listeners
  private preventClick(e: MouseEvent) {
    e.preventDefault();
  }

  protected async descriptionChanged() {
    if (this.selected || this.selected === undefined) {
      clearInterval(this.intervals.document);

      this.intervals.document = setTimeout(async () => {
        var [title, description] = this.noteView.editor.getData();

        if (this.validate(title)) {
          if (this.selected) {
            this.save(title, description);
            await storage.cached.set('selected', this.selected.toString());
          } else {
            await storage.cached.set('description', title + '\n' + description);
          }
        }
      }, 175);
    }
  }

  protected async previewStateChanged() {
    if (this.selected && this.selected.preview) {
      clearInterval(this.intervals.scroll);

      this.intervals.scroll = setTimeout(async () => {
        let scrollTop = this.noteView.html.scrollTop;
        let selection = NodeHelper.getSelection(this.noteView.html);

        if (this.selected) {
          this.selected.previewState = `${scrollTop}|${selection}`;
          await storage.cached.set('selected', this.selected.toString());
        }
      }, 600);
    }
  }

  protected async cursorMoved() {
    if (this.selected || this.selected === undefined) {
      clearInterval(this.intervals.cursor);

      this.intervals.cursor = setTimeout(async () => {
        if (this.selected) {
          this.selected.selection = this.noteView.editor.getSelection();
          await storage.cached.set('selected', this.selected.toString());
          this.selected.cursor = this.noteView.editor.getCursor();
        } else {
          await storage.cached.set('selection', this.noteView.editor.getSelection());
        }
      }, 600);
    }
  }

  protected async saveHandler() {
    if (this.new) {
      this.addNote();
    } else if (this.selected) {
      var [title, description] = this.noteView.editor.getData();

      if (this.validate(title, true)) {
        this.save(title, description);
        await storage.cached.set('selected', this.selected.toString());
      }
    }
  }

  protected async cancelHandler() {
    if (this.new) {
      await this.cancelCreation();
    }
  }

  protected onNewNoteCreated(id: number) {
    this.cacheList();
  }
  //#endregion

  //#region Public-Members
  async selectNew(description: string = '', selection?: string) {
    console.log('selectNew', [description, selection]);

    this.noteView.editor.value = description;
    this.noteView.editor.setSelection(selection);

    this.new = true;
    this.selected = undefined;

    await storage.cached.set('new', 'true');
  }

  public set lock(value: boolean) {
    this._locked = true;
  }

  public showList() {}

  public showNote() {}
  //#endregion

  //#region Protected-Members
  protected async remove() {
    if (this.selected) {
      this.selected.remove();

      for (let i = this.selected.index + 1; i < this.notes.length; i++) {
        this.notes[i].index = i - 1;
      }

      this.notes.splice(this.selected.index, 1);
      delete this.selected;

      Note.saveQueue();
      this.cacheList();
    }
  }

  // TODO review events
  protected async togglePreview() {
    this.selected.preview = this.noteView.preview.checked;

    if (this.noteView.preview.checked) {
      var scrollTop = this.noteView.editor.scrollTop;

      this.showPreview(this.noteView.editor.render());
      this.noteView.html.scrollTop = scrollTop;

      this.selected.html = this.noteView.html.innerHTML;
    } else {
      var scrollTop = this.noteView.html.scrollTop;

      this.hidePreview();
      this.noteView.editor.focus();
      this.noteView.editor.scrollTop = scrollTop;

      this.selected.html = null;
      this.selected.previewState = null;
    }

    await storage.cached.set('selected', this.selected.toString());
  }

  protected showPreview(value: string) {
    this.noteView.editor.hide();
    this.noteView.html.innerHTML = value;
    this.noteView.html.style.display = 'inherit';
  }

  protected hidePreview() {
    this.noteView.editor.show();
    this.noteView.html.style.display = 'none';
  }

  protected setPreviewSelection(previewState?: string) {
    if (previewState && previewState.length > 1) {
      let [scrollTop, selection] = previewState.split('|');

      this.noteView.html.scrollTop = Number(scrollTop) || 0;
      NodeHelper.setSelection(selection, this.noteView.html);
    } else {
      this.noteView.html.scrollTop = 0;
    }
  }

  protected validate(title: string, animate: boolean = false): boolean {
    return !Validator.required(title, animate && this.noteView.editor.wrapper);
  }

  // TODO review usage
  protected async cacheList(db: DbNote[] = null) {
    var notes: (DbNote | Note)[] = db || this.notes;
    var cache: (string | number)[] = [];

    for (let i = 0; i < Math.min(21, notes.length); i++) {
      const note = notes[i];

      if (note) {
        cache = cache.concat([note.id, note.title, note.updated]);
      }
    }

    await storage.cached.set('list', cache);
  }

  public selectNote(item: Note | ICachedNote, bind?: boolean, save?: boolean) {
    const value = item.title + '\n' + item.description;

    if (item.new) {
      const cached = <ICachedNote>item;
      return this.selectNew(value, cached.selection);
    }

    if (!Sorting.busy) {
      const note = <Note>item;

      this.showNote();
      this.bind(value, note.cursor, note.html, note.previewState, save && note.cached);

      this.selected = note;
      this.noteView.preview.checked = note.preview;
    }
  }

  protected async bind(description: string, selection?: string, html?: string, pState?: string, cached?: ICachedNote) {
    this.noteView.editor.value = description;
    this.noteView.editor.setSelection(selection);

    if (html) {
      this.showPreview(html);
      this.setPreviewSelection(pState);
    }

    if (cached) {
      await storage.cached.set('selected', cached);
    }
  }

  protected save(title: string, description: string) {
    if (this.selected && (this.selected.title !== title || this.selected.description !== description)) {
      this.selected.title = title;
      this.selected.description = description;
      this.selected.save();
      this.cacheList();
    }
  }
  //#endregion

  protected async addNote() {
    var note: Note = await this.createNote();

    if (note) {
      this.new = false;
      this.selectNote(note, false, true);
    }
  }

  protected async createNote(): Promise<Note> {
    var [title, description] = this.noteView.editor.getData();

    if (this.validate(title, true)) {
      // TODO Review state savings, synch and preview.
      // TODO new note doesn't have id yet, state needs to be reviewed.
      let note: Note = new Note(null, this.notes.length);

      note.title = title;
      note.description = description;
      note.cursor = this.noteView.editor.getSelection();
      note.save();

      this.notes.push(note);
      this.listView.items.appendChild(note.element);
      note.onclick = this.selectNote.bind(this, note, true, true);
      note.sortButton.onmousedown = Sorting.start.bind(Sorting, note);

      Sorting.notes = this.notes;
      Sorting.items = this.listView.items;

      this.newView.cancel.style.display = 'None';
      this.newView.create.style.display = 'None';

      await storage.cached.remove('new');
      await storage.cached.remove('description');
      await storage.cached.remove('selection');

      return note;
    }
  }

  protected async cancelCreation() {
    this.new = false;
  }
}
