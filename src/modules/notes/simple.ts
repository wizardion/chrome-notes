import {NodeHelper} from './components/node-helper';
import {Base} from './base';
import {IListView, INewNoteView, INoteView} from './components/interfaces';


export class Simple extends Base {
  constructor(listView: IListView, noteView: INoteView, newView: INewNoteView) {
    super(listView, noteView, newView);
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
    super.selectNew(description, selection);
  }

  protected cancelCreation() {
    this.newView.cancel.style.display = 'None';
    this.newView.create.style.display = 'None';

    this.showList();
  }

  protected remove() {
    super.remove();
    this.showList();
  }

  public showList() {
    this.listView.node.style.display = 'inherit';
    this.noteView.node.style.display = 'None';

    this.hidePreview();
    localStorage.clear();

    if (this.selected) {
      this.selected.element.scrollIntoView();
    }

    this.selected = null;
  }

  public showNote(description: string, bind?: boolean, selection?: string, html?: string, pState?: string) {
    this.listView.node.style.display = 'None';
    this.noteView.node.style.display = 'inherit';
    this.noteView.back.style.display = 'inherit';
    this.noteView.delete.style.display = 'inherit';
    this.noteView.sync.parentElement.style.display = 'inherit';
    this.noteView.preview.parentElement.style.display = 'inherit';

    if (bind) {
      this.noteView.editor.value = description;

      if (html) {
        this.showPreview(html);
        this.setPreviewSelection(pState);
        // TODO too many usage
        this.noteView.preview.checked = true;
      }

      // To prevent stealing nodes selection.
      this.noteView.editor.setSelection(selection);
    }
  }

  protected setPreviewSelection(previewState?: string) {
    if (previewState) {
      let [scrollTop, selection] = previewState.split('|');

      this.noteView.html.scrollTop = parseInt(scrollTop);
      NodeHelper.setSelection(selection, this.noteView.html);
    } else {
      this.noteView.html.scrollTop = 0;
    }
  }
}