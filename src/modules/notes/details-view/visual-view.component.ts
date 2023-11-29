import { DetailsViewElement } from './base-view.component';
import { VisualView } from './components/html-editor/visual-view.controller';


export class VisualViewElement extends DetailsViewElement {
  static readonly selector = 'details-view';

  constructor() {
    super();

    this.form.elements.preview.parentElement.hidden = true;
    // this.editor = new VisualView(this.form.elements.description, this.form.elements.formatters);
    this.editor = new VisualView(this.form.elements.previewer, this.form.elements.formatters);
  }

  protected render(): void {
    super.render();

    // this.editor = new VisualView(this.form.elements.description, this.form.elements.formatters);
    // this.form.elements.previewer.hidden = false;
    // this.form.elements.previewer.removeAttribute('hidden');
    // setTimeout(() => {
    //   this.form.elements.previewer.hidden = false;
    // }, 1000);
  }
}
