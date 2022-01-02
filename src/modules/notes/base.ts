import {IListView, INewNoteView, INoteView, Intervals, ISTNote} from './components/interfaces';
import {DbNote} from '../db/note';
import {loadFromCache,loadAll} from '../db/provider';
import {Note} from './components/note';
import {Validator} from './components/validation';
import {Sorting} from './components/sorting';
import {ScrollListener} from './components/scrolling';
import {NodeHelper} from './components/node-helper';
import storage from '../storage/storage';


export class Base {
  protected notes: Note[];
  protected selected?: Note;
  protected intervals: Intervals;
  protected listView: IListView;
  protected noteView: INoteView;
  protected newView: INewNoteView;
  private cacheIndex?: number;
  protected new?: boolean;

  constructor(listView: IListView, noteView: INoteView, newView: INewNoteView) {
    this.notes = [];
    this.intervals = {};
    this.selected = null;
    this.listView = listView;
    this.noteView = noteView;
    this.newView = newView;
  }

  public initFromCache(list?: string) {
    this.buildFromCache(loadFromCache(list));
  }

  protected buildFromCache(notes: DbNote[]) {
    if (notes.length > 0) {
      this.listView.items.appendChild(this.render(notes));
    }
  }

  // public selectFromCache(index: number, description: string, bind?: boolean, selection?: string, html?: string, pState?: string) {
  public selectFromCache(note: ISTNote) {
    if (note.index !== null && this.notes.length > 0 && note.index < this.notes.length) {
      var selected = this.notes[note.index];

      selected.set(note);
      return this.selectNote(selected, true);
    }

    this.cacheIndex = note.index;
    this.showNote(note.title + '\n' + note.description, true, note.cState, note.html, note.pState);
  }

  public init() {
    loadAll(this.build.bind(this));
    // loadAll((notes: DbNote[]) => {
    //   setTimeout(() => {
    //     this.build(notes);
    //   }, 1000);
    // });

    if (chrome && chrome.runtime) {
      chrome.runtime.sendMessage('get-sync-notes', (response) => {
        if (response.working) {
          let time: number = 30000 - (new Date().getTime() - response.time);
          let indicator:HTMLElement = <HTMLElement>document.getElementById('sync-indicator');
          
          indicator.style.display = 'inherit';
          setTimeout(() => {
            indicator.style.display = 'none';
          }, time);
        }
      });
    }
  }

  protected build(notes: DbNote[]) {
    if (notes.length > 0) {
      this.listView.items.appendChild(this.render(notes));

      Sorting.notes = this.notes;
      Sorting.items = this.listView.items;
      Sorting.onEndSorting = this.cacheList.bind(this);

      if (!this.selected && this.cacheIndex >= 0 && this.notes.length) {
        this.selectNote(this.notes[this.cacheIndex]);
      }
    }

    this.listView.addButton.addEventListener('mousedown', this.prevent.bind(this));
    this.noteView.back.addEventListener('mousedown', this.prevent.bind(this));
    this.noteView.delete.addEventListener('mousedown', this.prevent.bind(this));
    this.noteView.preview.parentElement.addEventListener('mousedown', this.prevent.bind(this));
    this.noteView.sync.parentElement.addEventListener('mousedown', this.prevent.bind(this));
    this.newView.create.addEventListener('mousedown', this.prevent.bind(this));
    this.newView.cancel.addEventListener('mousedown', this.prevent.bind(this));

    this.listView.addButton.addEventListener('click', this.selectNew.bind(this, '', null));
    this.noteView.delete.addEventListener('click', this.remove.bind(this));
    this.noteView.preview.addEventListener('click', this.previewClick.bind(this));
    this.noteView.sync.addEventListener('click', this.syncClick.bind(this));
    this.newView.create.addEventListener('click', this.placeNote.bind(this));
    this.newView.cancel.addEventListener('click', this.cancelCreation.bind(this));
    this.noteView.html.addEventListener('scroll', this.previewStateChanged.bind(this));

    document.addEventListener('selectionchange', this.previewStateChanged.bind(this));

    this.noteView.editor.on('change', this.descriptionChanged.bind(this));
    this.noteView.editor.on('cursorActivity', this.cursorMoved.bind(this));
    this.noteView.editor.on('save', this.saveHandler.bind(this));
    this.noteView.editor.on('cancel', this.cancelHandler.bind(this));

    ScrollListener.listen(this.listView.items, 550);
    ScrollListener.listen(this.noteView.editor.scroll, 550);
    ScrollListener.listen(this.noteView.html, 550);

    this.cacheList();
  }

  private render(items: DbNote[]) {
    var fragment = <DocumentFragment>document.createDocumentFragment();

    for (var i = 0; i < items.length; i++) {
      const item = items[i];
      const note = this.notes[i];

      if (!note) {
        const newNote = new Note(item, i);

        this.notes.push(newNote);
        fragment.appendChild(newNote.element);
        newNote.onclick = this.selectNote.bind(this, newNote, true, true);
        newNote.sortButton.onmousedown = Sorting.start.bind(Sorting, newNote);
      } else {
        note.set(item);
      }
    }

    return fragment;
  }

  public selectNew(description: string, selection?: string) {
    this.noteView.editor.value = description;
    this.noteView.editor.setSelection(selection);

    storage.set('new', 'true');
    this.selected = undefined;
    this.new = true;
  }

  protected createNote(): Note {
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
      
      storage.remove('new');
      storage.remove('description');
      storage.remove('selection');
      
      return note;
    }
  }

  protected placeNote() {
    var note: Note = this.createNote();

    if (note) {
      this.new = false;

      this.selectNote(note, false, true);
      this.cacheList();
    }
  }

  protected cancelCreation() {
    this.new = false;
  }

  protected selectNote(note: Note, bind?: boolean, save?: boolean) {
    if (!Sorting.busy) {
      let value = note.title + '\n' + note.description;

      // TODO do we need this here?
      this.showNote(value, bind, note.cursor, note.html, note.previewState);

      this.selected = note;
      this.noteView.preview.checked = note.preview;
      this.noteView.sync.checked = this.selected.sync;

      if (save) {
        storage.set('selected', note.toString());
      }
    }
  }

  protected remove() {
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

  // TODO review evernts
  protected previewClick() {
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

    storage.set('selected', this.selected.toString());
  }

  protected syncClick() {
    this.selected.sync = this.noteView.sync.checked;
    storage.set('selected', this.selected.toString());
  }

  protected descriptionChanged() {
    if (this.selected || this.selected === undefined) {
      clearInterval(this.intervals.document);

      this.intervals.document = setTimeout(() => {
        var [title, description] = this.noteView.editor.getData();

        if (this.validate(title)) {
          if (this.selected) {
            this.save(title, description);
            storage.set('selected', this.selected.toString());
          } else {
            storage.set('description', title + '\n' + description);
          }
        }
      }, 175);
    }
  }

  protected previewStateChanged() {
    if (this.selected && this.selected.preview) {
      clearInterval(this.intervals.scroll);

      this.intervals.scroll = setTimeout(() => {
        let scrollTop = this.noteView.html.scrollTop;
        let selection = NodeHelper.getSelection(this.noteView.html);

        if (this.selected) {
          this.selected.previewState = `${scrollTop}|${selection}`;
          storage.set('selected', this.selected.toString());
        }
      }, 600);
    }
  }

  protected cursorMoved() {
    if (this.selected || this.selected === undefined) {
      clearInterval(this.intervals.cursor);

      this.intervals.cursor = setTimeout(() => {
        if (this.selected) {
          this.selected.cursor = this.noteView.editor.getCursor();
          storage.set('selected', this.selected.toString());
        } else {
          storage.set('selection', this.noteView.editor.getSelection());
        }
      }, 600);
    }
  }

  protected saveHandler() {
    if (this.new) {
      this.placeNote();
    } else if (this.selected) {
      var [title, description] = this.noteView.editor.getData();

      if (this.validate(title, true)) {
        this.save(title, description);
        storage.set('selected', this.selected.toString());
      }
    }
  }

  protected cancelHandler() {
    if (this.new) {
      this.cancelCreation();
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

  public showList() {

  }

  //TODO review params
  public showNote(description: string, bind?: boolean, selection?: string, html?: string, pState?: string) {
    
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

  private prevent(e: MouseEvent) {
    e.preventDefault();
  }

  // TODO review usage
  protected cacheList() {
    var notes: (string|number)[] = [];

    for (let i = 0; i < Math.min(21, this.notes.length); i++) {
      const note = this.notes[i];

      notes = notes.concat([note.title, note.updated]);
    }

    storage.set('list', JSON.stringify(notes).replace(/^\[|\]$/gi, ''), true);
  }
}
