import {Base} from './base';
import {Note} from './components/note';
import {DbNote} from '../db/note';
import {IListView, INewNoteView, INoteView, ISTNote} from './components/interfaces';
import storage from '../storage/storage';


export class Mixed extends Base {
  private reserved?: Note;

  constructor(listView: IListView, noteView: INoteView, newView: INewNoteView) {
    super(listView, noteView, newView);

    this.listView.node.classList.add('mixed');
    this.noteView.node.classList.add('mixed');

    this.noteView.delete.style.display = 'none';
    this.noteView.sync.parentElement.style.display = 'none';
    this.noteView.preview.parentElement.style.display = 'none';

    this.noteView.editor.hide();
  }

  public selectFromCache(note: ISTNote) {
    super.selectFromCache(note);

    if (this.selected && !this.new) {
      this.selected.element.scrollIntoView({block: 'nearest'});
    }
  }

  protected build(notes: DbNote[]) {
    super.build(notes);

    if (!this.selected && !this.new && notes.length) {
      return this.selectNote(this.notes[0], true, true);
    }

    if (this.selected && !this.new) {
      setTimeout(() => {
        this.selected.element.scrollIntoView({block: 'nearest', behavior: 'smooth'});
      }, 100);
    }
  }

  public selectNew(description: string, selection?: string) {
    this.newView.cancel.style.display = 'inherit';
    this.newView.create.style.display = 'inherit';
    this.noteView.delete.style.display = 'none';
    this.noteView.sync.parentElement.style.display = 'none';
    this.noteView.preview.parentElement.style.display = 'none';
    this.listView.addButton.style.visibility = 'collapse';

    if (this.selected) {
      this.selected.element.classList.remove('selected');
      this.reserved = this.selected;
    }

    this.hidePreview();
    super.selectNew(description, selection);
  }

  protected cancelCreation() {
    this.newView.cancel.style.display = 'None';
    this.newView.create.style.display = 'None';
    this.listView.addButton.style.visibility = '';

    storage.clear();
    this.new = false;

    if (this.notes.length) {
      let reserved = this.reserved || this.notes[0];

      this.noteView.delete.style.display = 'inherit';
      this.noteView.sync.parentElement.style.display = 'inherit';
      this.noteView.preview.parentElement.style.display = 'inherit';

      this.reserved = null;
      this.selectNote(reserved, true, true);
    } else {
      this.noteView.editor.hide();
    }
  }

  protected placeNote() {
    var note: Note = this.createNote();

    if (note) {
      this.listView.addButton.style.visibility = '';
      this.reserved = null;
      this.new = false;

      this.selectNote(note, false, true);
      this.cacheList();

      this.selected.element.scrollIntoView({block: 'nearest'});
    }
  }

  protected remove() {
    var index = this.selected.index;

    storage.clear();
    super.remove();
    this.hidePreview();

    if (index > 0) {
      this.selectNote(this.notes[index - 1], true, true);
    } else {
      this.noteView.editor.value = '';
      this.noteView.delete.style.display = 'none';
      this.noteView.sync.parentElement.style.display = 'none';
      this.noteView.preview.parentElement.style.display = 'none';

      this.noteView.editor.hide();
    }
  }

  protected selectNote(note: Note, bind?: boolean, save?: boolean) {
    if (this.new) {
      this.reserved = note;
      return this.cancelCreation();
    }
    
    this.select(note, bind, save);
  }

  public showNote(description: string, bind?: boolean, selection?: string, html?: string, pState?: string) {
    this.noteView.delete.style.display = 'inherit';
    this.noteView.sync.parentElement.style.display = 'inherit';
    this.noteView.preview.parentElement.style.display = 'inherit';

    if (!this.noteView.editor.displayed) {
      this.noteView.editor.show();
    }

    if (bind) {
      this.noteView.editor.value = description;
      this.noteView.editor.setSelection(selection);

      if (html) {
        this.showPreview(html);
        this.setPreviewSelection(pState);
      }
    }
  }

  private select(note: Note, bind?: boolean, save?: boolean) {
    if (this.selected) {
      var [title, description] = this.noteView.editor.getData();

      if (this.selected === note || !this.validate(title, true)) {
        return;
      }

      this.selected.element.classList.remove('selected');
      // this.save(title, description);
      this.hidePreview();
      storage.clear();
    }

    super.selectNote(note, bind, save);
    this.selected.element.classList.add('selected');
  }
}
