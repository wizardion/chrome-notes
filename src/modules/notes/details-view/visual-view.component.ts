import { DetailsViewElement } from './base-view.component';
import { VisualEditor } from 'components/visual-editor';


export class VisualViewElement extends DetailsViewElement {
  static readonly selector = 'details-view';

  constructor() {
    super();

    this.form.elements.preview.hidden = true;
  }

  protected render(): void {
    super.render();
    this.editor = new VisualEditor(this.form.elements.previewer, this.form.elements.menu.controls);
  }

  set draft(value: boolean) {
    this._draft = value;

    this.form.elements.delete.hidden = value;
    this.form.elements.create.hidden = !value;
    this.form.elements.cancel.hidden = !value;
    this.form.elements.back.hidden = value;
  }

  set preview(value: boolean) {

  }
}
