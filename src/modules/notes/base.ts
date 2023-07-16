import {IListView, INewNoteView, INoteView, Intervals, ISTNote} from './components/interfaces';
import {DbNote} from '../db/note';
import {loadFromCache,loadAll} from '../db/provider';
import {Note} from './components/note';
import {Validator} from './components/validation';
import {Sorting} from './components/sorting';
import {ScrollListener} from './components/scrolling';
import {NodeHelper} from './components/node-helper';
import storage from '../storage/storage';
import {Logger} from '../logger/logger';


const logger: Logger = new Logger('base.ts', 'red');
export class Base {
  protected notes: Note[];
  protected selected?: Note;
  protected intervals: Intervals;
  protected listView: IListView;
  protected noteView: INoteView;
  protected newView: INewNoteView;
  private cacheIndex?: number;
  protected new?: boolean;
  protected locked: boolean;
  private _maxSyncItems: number;
  private _syncedItems: number;

  constructor(listView: IListView, noteView: INoteView, newView: INewNoteView) {
    this.notes = [];
    this.intervals = {};
    this.selected = null;
    this.listView = listView;
    this.noteView = noteView;
    this.newView = newView;
    this.locked = true;
    this._maxSyncItems = 0;
    this._syncedItems = 0;
  }

  public initFromCache(list?: string) {
    this.buildFromCache(loadFromCache(list));
  }

  protected buildFromCache(notes: DbNote[]) {
    if (notes.length > 0) {
      this.listView.items.appendChild(this.render(notes));
    }
  }

  public selectFromCache(note: ISTNote) {
    if (note.index !== null && this.notes.length > 0 && note.index < this.notes.length) {
      var selected = this.notes[note.index];

      selected.set(note);
      return this.selectNote(selected, true);
    }

    this.cacheIndex = note.index;
    this.showNote();
    this.bind((note.title || '') + '\n' + (note.description || ''), note.cState, note.html, note.pState);
  }

  public init() {
    loadAll().then(this.build.bind(this));
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
          this.bind(value, selected.cursor, selected.html, selected.previewState, selected.toString());
        }
      }
    }

    this.listView.addButton.addEventListener('mousedown', this.preventClick.bind(this));
    this.noteView.back.addEventListener('mousedown', this.preventClick.bind(this));
    this.noteView.delete.addEventListener('mousedown', this.preventClick.bind(this));
    this.noteView.preview.parentElement.addEventListener('mousedown', this.preventClick.bind(this));
    this.newView.create.addEventListener('mousedown', this.preventClick.bind(this));
    this.newView.cancel.addEventListener('mousedown', this.preventClick.bind(this));

    this.listView.addButton.addEventListener('click', this.selectNew.bind(this, '', null));
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

    if (this.locked) {
      this.noteView.sync.parentElement.setAttribute('title', 'Enable synchronization in settings...');
    }

    this.cacheList(notes);
  }

  //#region Event-Listeners
  private async preventClick(e: MouseEvent) {
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
  public get maxLength(): number {
    return this.noteView.editor.maxLength;
  }

  public set maxLength(value: number) {
    this.noteView.editor.maxLength = value;
  }

  public get maxSyncItems(): number {
    return this._maxSyncItems;
  }

  public set maxSyncItems(value: number) {
    this._maxSyncItems = value;
  }

  public get syncedItems(): number {
    return this._syncedItems;
  }

  public set syncedItems(value: number) {
    this._syncedItems = value;

    console.log('syncedItems = ', value);
    this.setSyncAvailability();
  }
  
  private setSyncAvailability() {
    console.log('this.syncedItems', this.syncedItems, this.maxSyncItems);

    if (this.maxSyncItems > 0 && this.syncedItems >= (this.maxSyncItems) && !this.noteView.sync.checked) {
      this.noteView.sync.disabled = true;
      this.noteView.sync.parentElement.setAttribute('title', 'No more space is available to sync.');
    } else if (!this.locked) {
      this.noteView.sync.disabled = false;
      this.noteView.sync.parentElement.setAttribute('title', 'sync note');
    }
  }

  public async selectNew(description: string, selection?: string, sync?: boolean) {
    this.noteView.editor.value = description;
    this.noteView.editor.setSelection(selection);
    this.noteView.sync.checked = (sync === true);

    this.new = true;
    this.selected = undefined;

    this.setSyncAvailability();
    await storage.cached.set('new', 'true');
  }

  public unlock() {
    this.locked = false;
    this.noteView.sync.disabled = false;
    this.noteView.sync.parentElement.addEventListener('mousedown', this.preventClick.bind(this));
    this.noteView.sync.parentElement.setAttribute('title', 'sync note');
  }

  public showList() {

  }

  public showNote() {
    
  }
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
    var notes: (DbNote|Note)[] = db || this.notes;
    var cache: (string|number)[] = [];

    for (let i = 0; i < Math.min(21, notes.length); i++) {
      const note = notes[i];

      if (note) {
        cache = cache.concat([note.id, note.title, note.updated]);
      }
    }

    await storage.cached.set('list', JSON.stringify(cache).replace(/^\[|\]$/gi, ''));
  }

  protected selectNote(note: Note, bind?: boolean, save?: boolean) {
    if (!Sorting.busy) {
      let value = note.title + '\n' + note.description;
      logger.info(`selectNote, bind[${bind}]`, note.description);

      this.showNote();
      this.bind(value, note.cursor, note.html, note.previewState, save && note.toString());

      this.selected = note;
      this.noteView.preview.checked = note.preview;
      this.setSyncAvailability();
    }
  }

  protected async bind(description: string, selection?: string, html?: string, pState?: string, selected?: string) {
    this.noteView.editor.value = description;
    this.noteView.editor.setSelection(selection);

    if (html) {
      this.showPreview(html);
      this.setPreviewSelection(pState);
    }

    if (selected) {
      await storage.cached.set('selected', selected);
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

  //#region Private-Members
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
  //#endregion

  protected async addNote() {
    var note: Note = await this.createNote();

    if (note) {
      this.new = false;
      this.selectNote(note, false, true);
      // await storage.cached.remove('sync');
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
      await storage.cached.remove('sync');
      
      return note;
    }
  }

  protected async cancelCreation() {
    this.new = false;
  }
}
