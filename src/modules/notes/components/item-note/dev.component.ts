import { BaseElement } from 'modules/core/base.component';

const template: DocumentFragment = BaseElement.template(require('html-loader!./template.html').default);


export class ItemNoteElement extends BaseElement {
  static observedAttributes = ['disabled'];

  protected template: HTMLElement;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
  }

  protected render() {
    this.appendChild(this.template);
  }

  protected async eventListeners() {
    // this.event = new Event('mode:change');
  }
}
