import {IListView, INewNoteView, INoteView, Intervals} from './components/interfaces';
import {DbNote} from '../db/note';
import {Note} from './components/note';
import {Validator} from './components/validation';
import {Sorting} from './components/sorting';
import {ScrollListener} from './components/scrolling';
import {NodeHelper} from './components/node-helper';


export class Base {
  protected notes: Note[];
  protected selected?: Note;
  protected intervals: Intervals;
  protected listView: IListView;
  protected noteView: INoteView;
  protected newView: INewNoteView;

  constructor(listView: IListView, noteView: INoteView, newView: INewNoteView) {
    this.notes = [];
    this.intervals = {};
    this.selected = null;
    this.listView = listView;
    this.noteView = noteView;
    this.newView = newView;

    this.listView.addButton.addEventListener('mousedown', this.prevent.bind(this));
    this.noteView.back.addEventListener('mousedown', this.prevent.bind(this));
    this.noteView.delete.addEventListener('mousedown', this.prevent.bind(this));
    this.noteView.preview.parentElement.addEventListener('mousedown', this.prevent.bind(this));
    this.noteView.sync.parentElement.addEventListener('mousedown', this.prevent.bind(this));
    this.newView.create.addEventListener('mousedown', this.prevent.bind(this));
    this.newView.cancel.addEventListener('mousedown', this.prevent.bind(this));

    this.listView.addButton.addEventListener('click', this.selectNew.bind(this, '', null));
    this.noteView.back.addEventListener('click', this.backToList.bind(this));
    this.noteView.delete.addEventListener('click', this.remove.bind(this));
    this.noteView.preview.addEventListener('click', this.previewClick.bind(this));
    this.noteView.sync.addEventListener('click', this.syncClick.bind(this));
    this.newView.create.addEventListener('click', this.createNote.bind(this));
    this.newView.cancel.addEventListener('click', this.cancelCreation.bind(this));
    this.noteView.html.addEventListener('scroll', this.previewStateChanged.bind(this));
    document.addEventListener('selectionchange', this.previewStateChanged.bind(this));

    this.noteView.editor.on('change', this.descriptionChanged.bind(this));
    this.noteView.editor.on('cursorActivity', this.cursorMoved.bind(this));

    ScrollListener.listen(this.listView.items);
    ScrollListener.listen(this.noteView.editor.scroll);
    ScrollListener.listen(this.noteView.html);
  }

  public init() {
    DbNote.loadAll(this.build.bind(this));
  }

  private prevent(e: MouseEvent) {
    e.preventDefault();
  }

  private build(notes: DbNote[]) {
    if (notes.length > 0) {
      this.listView.template.style.display = 'none';
      this.listView.items.appendChild(this.render(notes, 0, 10));

      Sorting.notes = this.notes;
      Sorting.items = this.listView.items;

      setTimeout(() => {
        let index = localStorage.getItem('index');
        this.listView.items.appendChild(this.render(notes, 10));

        if (index) {
          this.selectNote(this.notes[Number(index)]);
        }
      }, 10);
    }
  }

  private render(notes: DbNote[], start: number = 0, limit?: number) {
    var fragment = <DocumentFragment>document.createDocumentFragment();
    var length: number = limit && notes.length > limit ? limit : notes.length;

    for (var i = start; i < length; i++) {
      const note = new Note(notes[i], i);
      this.notes.push(note);
      fragment.appendChild(note.element);
      note.onclick = this.selectNote.bind(this, note, true);
      note.sortButton.onmousedown = Sorting.start.bind(Sorting, note);
    }

    return fragment;
  }

  public selectNew(description: string, selection?: string) {
    this.noteView.editor.value = description;
    this.noteView.editor.setSelection(selection);

    localStorage.setItem('description', description);
    localStorage.setItem('new', 'true');
    this.selected = undefined;
  }

  protected createNote() {
    var note: Note;
    var [title, description] = this.noteView.editor.getData();

    if (this.validate(title, true)) {
      if (!this.notes.length) {
        this.listView.template.style.display = 'none';
      }

      // TODO Review state savings, synch and preview.
      // TODO new note doesn't have id yet, state needs to bew reviewed.
      note = new Note(null, this.notes.length);
      note.title = title;
      note.description = description;
      note.cursor = this.noteView.editor.getSelection();
      note.save();

      this.notes.push(note);
      this.listView.items.appendChild(note.element);
      note.onclick = this.selectNote.bind(this, note, true);
      note.sortButton.onmousedown = Sorting.start.bind(Sorting, note);

      this.newView.cancel.style.display = 'None';
      this.newView.create.style.display = 'None';

      this.selectNote(note);
      localStorage.removeItem('new');
    }
  }

  protected cancelCreation() {

  }

  protected selectNote(note: Note, bind?: boolean) {
    if (!Sorting.busy) {
      let value = note.title + '\n' + note.description;

      // TODO do we need this here?
      this.showNote(value, bind, note.cursor, note.html, note.previewState);

      this.selected = note;
      this.noteView.sync.checked = this.selected.sync;

      localStorage.setItem('description', value);
      localStorage.setItem('index', note.index.toString());
      localStorage.setItem('selection', note.cursor.toString());

      if (note.preview) {
        localStorage.setItem('html', this.noteView.html.innerHTML);
      }
    }
  }

  protected remove() {
    if (this.selected) {
      this.selected.remove();

      this.notes.splice(this.selected.index, 1);
      delete this.selected;

      if (!this.notes.length) {
        this.listView.template.style.display = 'inherit';
      }
    }
  }

  protected backToList() {
    var [title, description] = this.noteView.editor.getData();

    if (this.selected && this.validate(title, true)) {
      this.save(title, description);
      this.showList();
    }

    if (!this.selected) {
      this.showList();
    }
  }

  // TODO review evernts
  protected previewClick() {
    this.selected.preview = this.noteView.preview.checked;

    if (this.noteView.preview.checked) {
      var scrollTop = this.noteView.editor.scrollTop;

      this.showPreview(this.noteView.editor.render());
      this.noteView.html.scrollTop = scrollTop;

      localStorage.setItem('html', this.noteView.html.innerHTML);
      this.selected.html = this.noteView.html.innerHTML;
    } else {
      var scrollTop = this.noteView.html.scrollTop;

      this.hidePreview();
      this.noteView.editor.focus();
      this.noteView.editor.scrollTop = scrollTop;

      localStorage.removeItem('html');
      this.selected.html = null;
      this.selected.previewState = null;
    }
  }

  protected syncClick() {
    this.selected.sync = this.noteView.sync.checked;
  }

  protected descriptionChanged() {
    if (this.selected || this.selected === undefined) {
      clearInterval(this.intervals.document);

      this.intervals.document = setTimeout(() => {
        var [title, description] = this.noteView.editor.getData();

        if (this.selected && this.validate(title)) {
          this.save(title, description);
        }

        localStorage.setItem('description', title + '\n' + description);
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
        }

        localStorage.setItem('previewState', `${scrollTop}|${selection}`);
      }, 600);
    }
  }

  protected cursorMoved() {
    if (this.selected || this.selected === undefined) {
      clearInterval(this.intervals.cursor);

      this.intervals.cursor = setTimeout(() => {
        var selection = this.noteView.editor.getSelection();

        if (this.selected) {
          this.selected.cursor = selection;
        }
        
        localStorage.setItem('selection', selection);
      }, 600);
    }
  }

  protected save(title: string, description: string) {
    if (this.selected && (this.selected.title !== title || this.selected.description !== description)) {
      this.selected.title = title;
      this.selected.description = description;
      this.selected.save();
    }
  }

  protected showList() {

  }

  //TODO review params
  public showNote(description: string, bind?: boolean, selection?: string, html?: string, pState?: string) {
    
  }

  protected showPreview(value: string) {
    this.noteView.editor.hide();
    this.noteView.html.innerHTML = value;
    this.noteView.html.style.display = '';
  }

  protected hidePreview() {
    this.noteView.editor.show();
    this.noteView.html.style.display = 'none';
  }

  protected validate(title: string, animate: boolean = false): boolean {
    return !Validator.required(title, animate && this.noteView.editor.wrapper);
  }
}