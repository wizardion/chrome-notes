import { NodeHelper } from './components/node-helper';
import {Base} from './base';


export class Simple extends Base {
  //TODO review params
  public showNote(description: string, bind?: boolean, selection?: string, preview?: boolean,
    html?: string, previewSelection?: string) {
    this.listView.node.style.display = 'None';
    this.noteView.node.style.display = 'inherit';
    this.noteView.back.style.display = 'inherit';
    this.noteView.delete.style.display = 'inherit';
    this.noteView.sync.parentElement.style.display = 'inherit';
    this.noteView.preview.parentElement.style.display = 'inherit';

    if (bind) {
      this.noteView.editor.value = description;

      if (preview) {
        this.showPreview(html || this.noteView.editor.render());
        this.setPreviewSelection(previewSelection);
        // TODO too many usage
        this.noteView.preview.checked = true;
      }

      // To prevent stealing nodes selection.
      this.noteView.editor.setSelection(selection);
    }
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

  protected setPreviewSelection(previewSelection?: string) {
    if (previewSelection) {
      let [scrollTop, selection] = previewSelection.split('|');

      this.noteView.html.scrollTop = parseInt(scrollTop);
      NodeHelper.setSelection(selection, this.noteView.html);
    } else {
      this.noteView.html.scrollTop = 0;
    }
  }
}