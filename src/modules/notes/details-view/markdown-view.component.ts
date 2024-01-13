import { BaseElement, FormElement } from 'core/components';
import { DetailsViewElement } from './base-view.component';
import { MarkdownEditor } from 'components/markdown-editor';
import { IDetailsViewForm } from './details-view.model';
import { EditorControlsElement } from '../editor-controls/editor-controls.component';
import { Debounce } from 'modules/effects';


// const template: DocumentFragment = BaseElement.component({
//   templateUrl: './markdown-view.component.html'
// });

export class MarkdownViewElement extends DetailsViewElement {
  static readonly selector = 'details-view';

  // constructor() {
  //   super();

  //   this.template = <HTMLElement>template.cloneNode(true);
  //   this.form = new FormElement<IDetailsViewForm>({
  //     content: this.template.querySelector('[name="details-view"]'),
  //     head: this.template.querySelector('[name="details-controls"]'),
  //     back: this.template.querySelector('[name="back"]'),
  //     cancel: this.template.querySelector('[name="cancel"]'),
  //     create: this.template.querySelector('[name="create"]'),
  //     delete: this.template.querySelector('[name="delete"]'),
  //     menu: (this.template.querySelector('[name="controls"]') as EditorControlsElement),
  //     menuGroup: this.template.querySelector('[name="controls-group"]'),
  //     description: this.template.querySelector('[name="description"]'),
  //     preview: this.template.querySelector('[name="preview"]'),
  //     previewer: this.template.querySelector('[name="previewer"]'),
  //   });
  // }

  protected render(): void {
    super.render();
    this.editor = new MarkdownEditor(this.form.elements.description, this.form.elements.menu.controls);
  }

  protected eventListeners(): void {
    const storeScroll = (e: Event) => {
      this.form.elements.content.dataset.scroll = ((e.target as HTMLElement).scrollTop > 0).toString();
    };

    this.editor.element.addEventListener('scroll', Debounce.debounce(storeScroll), { passive: true });
    this.form.elements.previewer.addEventListener('scroll', Debounce.debounce(storeScroll), { passive: true });
  }
}
