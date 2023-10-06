import {BaseElement} from 'modules/core/base.component';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './template.html'
});

export class ViewStyleElement extends BaseElement {
  protected fieldset: HTMLFieldSetElement;
  protected views: NodeList;
  protected index: number;
  protected event: Event;

  static observedAttributes = ['disabled', 'default-index'];

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.fieldset = this.template.querySelector('fieldset');
    this.views = <NodeList>this.template.querySelectorAll('input[name="views"]');
  }

  get value():number {
    return this.index;
  }

  set value(index: number) {
    for (let i = 0; i < this.views.length; i++) {
      const item: HTMLInputElement = <HTMLInputElement>this.views[i];
  
      if (parseInt(item.value) === index) {
        item.checked = true;
        this.index = index;
      }
    }
  }

  protected async eventListeners() {
    this.event = new Event('view:change');

    for (let i = 0; i < this.views.length; i++) {
      const item: HTMLInputElement = <HTMLInputElement>this.views[i];

      item.addEventListener('change', () => this.viewChanged(item));
    }
  }

  protected attributeChanged(name: string, oldValue: string, newValue: string) {
    if (name === 'disabled') {
      if (this.disabled) {
        this.fieldset.setAttribute('disabled', 'disabled');
      } else {
        this.fieldset.removeAttribute('disabled');
      }
    }

    if (name === 'default-index' && !this.index && this.index !== 0 && !isNaN(parseInt(newValue))) {
      this.value = parseInt(newValue);
    }
  }

  protected viewChanged(item: HTMLInputElement) {
    this.index = parseInt(item.value);
    this.dispatchEvent(this.event);
  }
}
