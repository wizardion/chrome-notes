import { BaseElement } from 'modules/core/base.component';


const template: DocumentFragment = BaseElement.template(require('./template.html').default);


export class ListViewElement extends BaseElement {
  static observedAttributes = ['disabled'];

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
  }

  protected async eventListeners() {
    // this.event = new Event('mode:change');
  }
}
