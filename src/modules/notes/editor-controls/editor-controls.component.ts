import './assets/editor-controls.scss';
import { BaseElement, FormElement } from 'core/components';
import { IEventListenerType, IEditorControlsFormItem } from './models/editor-controls.model';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './editor-controls.component.html'
});

export class EditorControlsElement extends BaseElement {
  static readonly selector = 'editor-controls';

  private form: FormElement<IEditorControlsFormItem>;
  private _index: number;
  private _title: string;
  private _date: Date;
  private _locked: boolean;

  constructor() {
    super();

    this.template = <HTMLElement>template.cloneNode(true);
    this.form = new FormElement<IEditorControlsFormItem>({
      items: <NodeList> this.template.querySelectorAll('button[action]'),
    });
  }

  get controls(): NodeList {
    return this.form.elements.items;
  }

  animateItem() {
    // const element = this.form.elements.item;

    // element.scrollIntoView({ behavior: 'instant', block: 'center' });
    // element.animate({
    //   background: 'rgba(7, 166, 152, 0.12)',
    //   color: 'rgb(6, 115, 106)',
    //   opacity: [1, 0.7],
    // }, {
    //   fill: 'forwards',
    //   direction: 'reverse',
    //   duration: 500,
    //   iterations: 1,
    // });
  }

  addEventListener(type: IEventListenerType, listener: EventListener, options?: boolean | AddEventListenerOptions) {
    return super.addEventListener(type, listener, options);
  }
}
