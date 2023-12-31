import { DetailsViewElement } from './base-view.component';
import { VisualEditor } from 'components/visual-editor';


export class VisualViewElement extends DetailsViewElement {
  static readonly selector = 'details-view';

  constructor() {
    super();

    this.form.elements.preview.parentElement.hidden = true;
    this.editor = new VisualEditor(this.form.elements.previewer, this.form.elements.formatters);
  }

  protected render(): void {
    super.render();
  }

  set preview(value: boolean) {

  }
}
