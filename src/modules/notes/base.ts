import {IControls} from './components/interfaces';
import {DbNote} from '../db/note';
import {Note} from './components/note';
import {Validator} from './components/validation';
import {Sorting} from './components/sorting';
import {ScrollListener} from './components/scrolling';

export class Base {
  private controls: IControls;
  private notes: Note[];
  private selected?: Note;
  private interval?: NodeJS.Timeout;
  private cursorInterval?: NodeJS.Timeout;

  constructor(elements: IControls) {
    this.notes = [];
    this.controls = elements;

    this.controls.listView.addButton.addEventListener('mousedown', this.prevent.bind(this));
    this.controls.noteView.back.addEventListener('mousedown', this.prevent.bind(this));
    this.controls.noteView.delete.addEventListener('mousedown', this.prevent.bind(this));
    this.controls.noteView.preview.addEventListener('mousedown', this.prevent.bind(this));
    this.controls.newView.create.addEventListener('mousedown', this.prevent.bind(this));
    this.controls.newView.cancel.addEventListener('mousedown', this.prevent.bind(this));

    this.controls.listView.addButton.addEventListener('click', this.selectNew.bind(this, '', null));
    this.controls.noteView.back.addEventListener('click', this.backToList.bind(this));
    this.controls.noteView.delete.addEventListener('click', this.remove.bind(this));
    this.controls.noteView.preview.addEventListener('click', this.preview.bind(this));
    this.controls.newView.create.addEventListener('click', this.createNote.bind(this));
    this.controls.newView.cancel.addEventListener('click', this.cancelCreation.bind(this));

    this.controls.noteView.editor.on('change', this.change.bind(this));
    this.controls.noteView.editor.on('cursorActivity', this.cursorActivity.bind(this));

    ScrollListener.listen(this.controls.listView.items);
    ScrollListener.listen(this.controls.noteView.editor.scroll);
    ScrollListener.listen(this.controls.noteView.html);
  }

  public init() {
    DbNote.loadAll(this.build.bind(this));
  }

  public showNote(description: string, bind?: boolean, selection?: string) {
    this.controls.listView.node.style.display = 'None';
    this.controls.noteView.node.style.display = 'inherit';
    this.controls.noteView.back.style.display = 'inherit';
    this.controls.noteView.delete.style.display = 'inherit';

    if (bind) {
      this.controls.noteView.editor.value = description;
      this.controls.noteView.editor.setSelection(selection);
    }
  }

  public showList() {
    this.selected = null;
    this.controls.listView.node.style.display = 'inherit';
    this.controls.noteView.node.style.display = 'None';

    this.removePreview();
    localStorage.clear();
    // localStorage.removeItem('new');
    // localStorage.removeItem('index');
    // localStorage.removeItem('selection');
    // localStorage.removeItem('description');
  }

  public selectNew(description: string, selection?: string) {
    this.selected = null;
    this.controls.listView.node.style.display = 'None';
    this.controls.newView.node.style.display = 'inherit';

    this.controls.newView.cancel.style.display = 'inherit';
    this.controls.newView.create.style.display = 'inherit';

    this.controls.noteView.back.style.display = 'none';
    this.controls.noteView.delete.style.display = 'none';

    this.controls.noteView.editor.value = description;
    this.controls.noteView.editor.setSelection(selection);
    localStorage.setItem('description', description);
    localStorage.setItem('new', 'true');
  }

  private build(notes: DbNote[]) {
    if (notes.length > 0) {
      this.controls.listView.template.style.display = 'none';
      this.controls.listView.items.appendChild(this.render(notes, 0, 10));
      
      Sorting.notes = this.notes;
      Sorting.items = this.controls.listView.items;

      setTimeout(() => {
        let index = localStorage.getItem('index');
        this.controls.listView.items.appendChild(this.render(notes, 10));

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

      this.selected = note;
      this.showNote(value, bind);
      localStorage.setItem('description', value);
      localStorage.setItem('index', note.index.toString());
    }
  }

  private backToList() {
    var [title, description] = this.controls.noteView.editor.getData();

    if (this.selected && this.validate(title, true)) {
      this.save(title, description);
      this.showList();
    }

    if (!this.selected) {
      this.showList();
    }
  }

  private cancelCreation() {
    this.controls.newView.cancel.style.display = 'None';
    this.controls.newView.create.style.display = 'None';

    this.showList();
  }

  private createNote() {
    var note: Note;
    var [title, description] = this.controls.noteView.editor.getData();

    if (this.validate(title, true)) {
      if (!this.notes.length) {
        this.controls.listView.template.style.display = 'none';
      }

      note = new Note(null, this.notes.length);
      note.title = title;
      note.description = description;
      note.save();

      this.notes.push(note);
      this.controls.listView.items.appendChild(note.element);
      note.onclick = this.selectNote.bind(this, note, true);
      note.sortButton.onmousedown = Sorting.start.bind(Sorting, note);

      this.controls.newView.cancel.style.display = 'None';
      this.controls.newView.create.style.display = 'None';

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
        this.controls.listView.template.style.display = 'inherit';
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

  private change() {
    clearInterval(this.interval);

    this.interval = setTimeout(() => {
      var [title, description] = this.controls.noteView.editor.getData();
      
      localStorage.setItem('description', title + '\n' + description);
      return this.selected && this.validate(title) && this.save(title, description);
    }, 175);
  }

  private preview() {
    if (!this.selected) {
      return;
    }

    if (!this.selected.view) {
      this.controls.noteView.html.innerHTML = this.controls.noteView.editor.render();
      this.controls.noteView.html.style.display = '';
      this.controls.noteView.preview.classList.add('checked');
      this.selected.view = true;
    } else {
      this.removePreview();
      this.controls.noteView.editor.focus();
      this.selected.view = false;
    }
  }

  private removePreview() {
    this.controls.noteView.html.style.display = 'none';
    this.controls.noteView.preview.classList.remove('checked');
  }

  private validate(title: string, animate: boolean = false): boolean {
    return !Validator.required(title, animate && this.controls.noteView.editor.wrapper);
  }

  private cursorActivity() {
    clearInterval(this.cursorInterval);

    this.cursorInterval = setTimeout(() => {
      localStorage.setItem('selection', this.controls.noteView.editor.getSelection());
    }, 300);
  }
}