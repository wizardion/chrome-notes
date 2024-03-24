import {Base} from './base';
import {IListView, INewNoteView, INoteView} from './components/interfaces';
import {Validator} from './components/validation';
import storage from '../storage/storage';


export class Simple extends Base {
  constructor(listView: IListView, noteView: INoteView, newView: INewNoteView) {
    super(listView, noteView, newView);

    this.noteView.back.addEventListener('click', this.backToList.bind(this));
  }

  protected backToList() {
    var [title, description] = this.noteView.editor.getData();

    if (this.selected && this.validate(title, true)) {
      this.save(title, description);
      return this.showList();
    }

    if (!this.selected) {
      this.showList();
    }
  }

  public async selectNew(description: string, selection?: string) {
    this.listView.node.style.display = 'None';
    this.newView.node.style.display = 'inherit';

    this.newView.cancel.style.display = 'inherit';
    this.newView.create.style.display = 'inherit';

    this.noteView.back.style.display = 'none';
    this.noteView.delete.style.display = 'none';
    this.noteView.preview.parentElement.style.display = 'none';

    super.selectNew(description, selection);
  }

  protected async cancelCreation() {
    this.newView.cancel.style.display = 'None';
    this.newView.create.style.display = 'None';
    this.new = false;

    this.showList();
  }

  protected async remove() {
    super.remove();
    this.showList();
  }

  public async showList() {
    this.listView.node.style.display = 'inherit';
    this.noteView.node.style.display = 'None';

    this.hidePreview();
    storage.cached.clear();

    if (this.selected) {
      this.selected.element.scrollIntoView({block: 'center'});
      Validator.animateSelected(this.selected.element, 2000);
    }

    this.selected = null;
  }

  public showNote() {
    this.listView.node.style.display = 'None';
    this.noteView.node.style.display = 'inherit';
    this.noteView.back.style.display = 'inherit';
    this.noteView.delete.style.display = 'inherit';
    this.noteView.preview.parentElement.style.display = 'inherit';
  }
}
