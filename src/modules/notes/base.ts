import {IControls} from './interfaces';
import {DbNote} from '../db/note';
import {Note} from './note';
import {Validator} from './validation';
// import 'codemirror/addon/display/placeholder'
import 'codemirror/mode/markdown/markdown.js'
import 'codemirror/mode/gfm/gfm.js';
import 'codemirror/lib/codemirror.css';
import '../../styles/codemirror.scss';

export class Base {
  private controls: IControls;
  private notes: Note[];
  private selected?: Note;

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
    this.controls.noteView.editor.on('blur', this.onChange.bind(this));
  }

  public init() {
    DbNote.loadAll(this.build.bind(this));
  }

  private build(notes: DbNote[]) {
    if (notes.length > 0) {
      this.controls.listView.items.innerHTML = '';
      this.controls.listView.items.appendChild(this.render(notes, 0, 10));
      
      setTimeout(function() {
        this.controls.listView.items.appendChild(this.render(notes, 10));
      }.bind(this), 10);
    }
  }

  private render(notes: DbNote[], start: number = 0, limit?: number) {
    var fragment = <DocumentFragment>document.createDocumentFragment();
    var length: number = limit && notes.length > limit ? limit : notes.length;

    for (var i = start; i < length; i++) {
      const note = new Note(notes[i], i);
      this.notes.push(note);
      fragment.appendChild(note.element);
      note.onclick = this.selectNote.bind(this, note, false);
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

  private selectNote(note: Note, binded?: boolean) {
    this.controls.listView.node.style.display = 'None';
    this.controls.noteView.node.style.display = 'inherit';
    this.controls.noteView.back.style.display = 'inherit';
    this.controls.noteView.delete.style.display = 'inherit';

    console.log({
      'binded': binded
    });

    if (!binded) {
      this.controls.noteView.editor.setValue(note.title + '\n' + note.description);
      this.controls.noteView.editor.focus();
    }

    this.selected = note;
  }

  private showList() {
    this.selected = null;
    this.controls.listView.node.style.display = 'inherit';
    this.controls.noteView.node.style.display = 'None';
  }

  private backToList() {
    if (!this.selected || this.onChange()) {
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
    var wrapper: HTMLElement = this.controls.noteView.editor.getWrapperElement();
    var [title, description] = this.getData(this.controls.noteView.editor.getValue());

    if (!Validator.required(title, wrapper)) {
      note = new Note(null, this.notes.length);
      note.title = title;
      note.description = description;
      note.save();

      this.notes.push(note);
      this.controls.listView.items.appendChild(note.element);
      note.onclick = this.selectNote.bind(this, note, false);

      this.controls.newView.cancel.style.display = 'None';
      this.controls.newView.create.style.display = 'None';

      this.selectNote(note, true);
    }
  }

  private remove() {
    if (this.selected) {
      this.selected.remove();

      this.notes.splice(this.selected.index, 1);
      delete this.selected;

      this.showList();
    }
  }

  private onChange(): boolean {
    if (this.selected) {
      var [title, description] = this.getData(this.controls.noteView.editor.getValue());
      var wrapper: HTMLElement = this.controls.noteView.editor.getWrapperElement();
      var valid: boolean = !Validator.required(title, wrapper);

      if (valid && (this.selected.title !== title || this.selected.description !== description)) {
        this.selected.title = title;
        this.selected.description = description;
        this.selected.save();
      }

      return valid;
    }

    return false;
  }

  private getData(value: string): string[] {
    var data: string[] = (value || '').split(/^([^\n]*)\r?\n/).filter((w, i) => i < 1 && w || i);
    var title: string = (data && data.length) ? data[0].trim() : '';
    var description: string = (data && data.length > 1)? data[1] : '';

    return [title, description];
  }
}