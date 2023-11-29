import { DetailsViewElement } from './base-view.component';
import { MarkdownView } from './components/editor/markdown-view.controller';


export class MarkdownViewElement extends DetailsViewElement {
  static readonly selector = 'details-view';

  constructor() {
    super();

    this.editor = new MarkdownView(this.form.elements.description, this.form.elements.formatters);
  }
}
