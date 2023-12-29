import { DetailsViewElement } from './base-view.component';
import { MarkdownEditor } from 'components/markdown-editor';


export class MarkdownViewElement extends DetailsViewElement {
  static readonly selector = 'details-view';

  constructor() {
    super();

    this.editor = new MarkdownEditor(this.form.elements.description, this.form.elements.formatters);
  }
}
