import {IControls} from './interfaces';
import {DbNote} from '../db/note';
import {Note} from './note';
import {Validator} from './validation';
// import 'codemirror/addon/display/placeholder'
import 'codemirror/mode/markdown/markdown.js'
import 'codemirror/mode/gfm/gfm.js';
import 'codemirror/lib/codemirror.css';
import '../../styles/codemirror.scss';
import { Sorting } from './sorting';
import { ScrollListener } from './scrolling';

export class Base {
  private controls: IControls;
  private notes: Note[];
  private selected?: Note;
  private interval?: NodeJS.Timeout;

  constructor(elements: IControls) {
    this.notes = [];
    this.controls = elements;

    this.controls.listView.addButton.addEventListener('mousedown', this.prevent.bind(this));
    this.controls.noteView.back.addEventListener('mousedown', this.prevent.bind(this));
    this.controls.noteView.delete.addEventListener('mousedown', this.prevent.bind(this));
    this.controls.newView.create.addEventListener('mousedown', this.prevent.bind(this));
    this.controls.newView.cancel.addEventListener('mousedown', this.prevent.bind(this));

    this.controls.listView.addButton.addEventListener('click', this.selectNew.bind(this));
    this.controls.noteView.back.addEventListener('click', this.backToList.bind(this));
    this.controls.noteView.delete.addEventListener('click', this.remove.bind(this));
    this.controls.newView.create.addEventListener('click', this.createNote.bind(this));
    this.controls.newView.cancel.addEventListener('click', this.cancelCreation.bind(this));
    this.controls.noteView.editor.on('change', this.change.bind(this));

    ScrollListener.listen(this.controls.listView.items);
    ScrollListener.listen(this.controls.noteView.wrapper.querySelector('.CodeMirror-vscrollbar'));
  }

  public init() {
    DbNote.loadAll(this.build.bind(this));
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

  private selectNew() {
    this.selected = null;
    this.controls.listView.node.style.display = 'None';
    this.controls.newView.node.style.display = 'inherit';

    this.controls.newView.cancel.style.display = 'inherit';
    this.controls.newView.create.style.display = 'inherit';

    this.controls.noteView.back.style.display = 'none';
    this.controls.noteView.delete.style.display = 'none';

    this.controls.noteView.editor.setValue('');
    this.controls.noteView.editor.focus();
  }

  private selectNote(note: Note, bind?: boolean) {
    if (!Sorting.busy) {
      this.showNote(note.title + '\n' + note.description, bind);
      this.selected = note;
      localStorage.setItem('index', note.index.toString());
      localStorage.setItem('description', note.title + '\n' + note.description);
    }
  }

  public showNote(note: string, bind?: boolean) {
    this.controls.listView.node.style.display = 'None';
    this.controls.noteView.node.style.display = 'inherit';
    this.controls.noteView.back.style.display = 'inherit';
    this.controls.noteView.delete.style.display = 'inherit';

    if (bind) {
      this.controls.noteView.editor.setValue('');
      this.controls.noteView.editor.focus();
      this.controls.noteView.editor.replaceSelection(note);
      this.controls.noteView.editor.setCursor({ line: 0, ch: 0 });
    }
  }

  public showList() {
    this.selected = null;
    this.controls.listView.node.style.display = 'inherit';
    this.controls.noteView.node.style.display = 'None';
    localStorage.removeItem('index');
    localStorage.removeItem('description');
  }

  private backToList() {
    var [title, description] = this.getData(this.controls.noteView.editor.getValue());

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
    var [title, description] = this.getData(this.controls.noteView.editor.getValue());

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
      var value = this.controls.noteView.editor.getValue();
      var [title, description] = this.getData(value);
      
      localStorage.setItem('description', value);
      return this.selected && this.validate(title) && this.save(title, description);
    }, 175);
  }

  private validate(title: string, animate: boolean = false): boolean {
    return !Validator.required(title, animate && this.controls.noteView.wrapper);
  }

  private getData(value: string): string[] {
    var data: string[] = (value || '').split(/^([^\n]*)\r?\n/).filter((w, i) => i < 1 && w || i);
    var title: string = (data && data.length) ? data[0].trim() : '';
    var description: string = (data && data.length > 1)? data[1] : '';

    return [title, description];
  }
}