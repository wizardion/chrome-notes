import {IListView, INewNoteView, INoteView, Intervals} from './components/interfaces';
import {DbNote} from '../db/note';
import {Note} from './components/note';
import {Validator} from './components/validation';
import {Sorting} from './components/sorting';
import { ScrollListener } from './components/scrolling';


export class Base {
  private notes: Note[];
  private selected?: Note;
  private intervals: Intervals;
  private listView: IListView;
  private noteView: INoteView;
  private newView: INewNoteView;

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
    this.noteView.html.addEventListener('scroll', this.previewScroll.bind(this));


    this.noteView.editor.on('change', this.descriptionChanged.bind(this));
    this.noteView.editor.on('cursorActivity', this.cursorMoved.bind(this));

    ScrollListener.listen(this.listView.items);
    ScrollListener.listen(this.noteView.editor.scroll);
    ScrollListener.listen(this.noteView.html);
  }

  public init() {
    DbNote.loadAll(this.build.bind(this));
  }

  //TODO review params
  public showNote(description: string, bind?: boolean, selection?: string, preview?: boolean, html?: string,
    scrollTop?: number) {
    this.listView.node.style.display = 'None';
    this.noteView.node.style.display = 'inherit';
    this.noteView.back.style.display = 'inherit';
    this.noteView.delete.style.display = 'inherit';
    this.noteView.sync.parentElement.style.display = 'inherit';
    this.noteView.preview.parentElement.style.display = 'inherit';

    if (bind) {
      this.noteView.editor.value = description;
      this.noteView.editor.setSelection(selection);

      if (preview) {
        this.showPreview(html, scrollTop);
        this.noteView.preview.checked = true;
      }
    }
  }

  public showList() {
    this.selected = null;
    this.listView.node.style.display = 'inherit';
    this.noteView.node.style.display = 'None';

    this.hidePreview();
    localStorage.clear();
  }

  public selectNew(description: string, selection?: string) {
    this.listView.node.style.display = 'None';
    this.newView.node.style.display = 'inherit';

    this.newView.cancel.style.display = 'inherit';
    this.newView.create.style.display = 'inherit';

    this.noteView.back.style.display = 'none';
    this.noteView.delete.style.display = 'none';
    this.noteView.sync.parentElement.style.display = 'none';
    this.noteView.preview.parentElement.style.display = 'none';

    // this.noteView.preview.checked = false;
    this.noteView.editor.value = description;
    this.noteView.editor.setSelection(selection);

    localStorage.setItem('description', description);
    localStorage.setItem('new', 'true');
    this.selected = undefined;
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
          this.selectNote(this.notes[parseInt(index)]);
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

  private prevent(e: MouseEvent) {
    e.preventDefault();
  }

  private selectNote(note: Note, bind?: boolean) {
    if (!Sorting.busy) {
      let value = note.title + '\n' + note.description;

      this.showNote(value, bind, null, note.preview);

      this.selected = note;
      this.noteView.preview.checked = this.selected.preview;
      this.noteView.sync.checked = this.selected.sync;

      localStorage.setItem('description', value);
      localStorage.setItem('index', note.index.toString());

      if (note.preview) {
        localStorage.setItem('html', this.noteView.html.innerHTML);
      }
    }
  }

  private backToList() {
    var [title, description] = this.noteView.editor.getData();

    if (this.selected && this.validate(title, true)) {
      this.save(title, description);
      this.showList();
    }

    if (!this.selected) {
      this.showList();
    }
  }

  private cancelCreation() {
    this.newView.cancel.style.display = 'None';
    this.newView.create.style.display = 'None';

    this.showList();
  }

  private createNote() {
    var note: Note;
    var [title, description] = this.noteView.editor.getData();

    if (this.validate(title, true)) {
      if (!this.notes.length) {
        this.listView.template.style.display = 'none';
      }

      note = new Note(null, this.notes.length);
      note.title = title;
      note.description = description;
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

  private remove() {
    if (this.selected) {
      this.selected.remove();

      this.notes.splice(this.selected.index, 1);
      delete this.selected;

      if (!this.notes.length) {
        this.listView.template.style.display = 'inherit';
      }

      this.showList();
    }
  }

  private save(title: string, description: string) {
    if (this.selected && (this.selected.title !== title || this.selected.description !== description)) {
      console.log('saving...');
      this.selected.title = title;
      this.selected.description = description;
      this.selected.save();
    }
  }

  private descriptionChanged() {
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

  private cursorMoved() {
    if (this.selected || this.selected === undefined) {
      clearInterval(this.intervals.cursor);

      this.intervals.cursor = setTimeout(() => {
        var selection = this.noteView.editor.getSelection();
        localStorage.setItem('selection', selection);
      }, 300);
    }
  }

  // TODO review evernts
  private previewClick() {
    if (this.noteView.preview.checked) {
      this.showPreview();
      this.selected.preview = true;
      localStorage.setItem('html', this.noteView.html.innerHTML);
    } else {
      var scrollTop = this.noteView.html.scrollTop;

      this.hidePreview();
      this.noteView.editor.focus();
      this.noteView.editor.scrollTop = scrollTop;
      this.selected.preview = false;
      localStorage.removeItem('html');
    }
  }

  private syncClick() {
    this.selected.sync = this.noteView.sync.checked;
  }

  private previewScroll() {
    if (this.selected && this.selected.preview) {
      clearInterval(this.intervals.scroll);

      this.intervals.scroll = setTimeout(() => {
        localStorage.setItem('previewScroll', this.noteView.html.scrollTop.toString());
      }, 300);
    }
  }

  private showPreview(value?: string, scrollTop?: number) {
    var top = scrollTop || this.noteView.editor.scrollTop;
    var html = value || this.noteView.editor.render();

    this.noteView.editor.hide();
    this.noteView.html.innerHTML = html;
    this.noteView.html.style.display = '';
    this.noteView.html.scrollTop = top;
  }

  private hidePreview() {
    this.noteView.editor.show();
    this.noteView.html.style.display = 'none';
  }

  // TODO Review
  private validate(title: string, animate: boolean = false): boolean {
    return !Validator.required(title, animate && this.noteView.editor.wrapper);
  }
}