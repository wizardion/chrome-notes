import { DetailsBaseElement } from '../details-base/details-base.component';
import { VisualEditor } from 'components/visual-editor';
import { IVisualViewForm } from './models/visual-view.model';
import { BaseElement, FormElement } from 'core/components';
import { EditorControlsElement } from '../editor-controls/editor-controls.component';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './visual-view.component.html'
});

export class VisualViewElement extends DetailsBaseElement<IVisualViewForm> {
  static readonly selector = 'details-view';

  constructor() {
    super();

    this.template = <HTMLElement>template.cloneNode(true);
    this.form = new FormElement<IVisualViewForm>({
      head: this.template.querySelector('[name="details-controls"]'),
      back: this.template.querySelector('[name="back"]'),
      cancel: this.template.querySelector('[name="cancel"]'),
      create: this.template.querySelector('[name="create"]'),
      delete: this.template.querySelector('[name="delete"]'),
      menu: (this.template.querySelector('[name="controls"]') as EditorControlsElement),
      menuGroup: this.template.querySelector('[name="controls-group"]'),
      editor: this.template.querySelector('[name="editor"]')
    });
  }

  protected render(): void {
    super.render();
    this.editor = new VisualEditor(this.form.elements.editor, this.form.elements.menu.controls);
  }
}
