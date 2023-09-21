/* 
  https://web.dev/custom-elements-v1/
*/
export class BaseElement extends HTMLElement {
  static observedAttributes = ['disabled'];

  protected template?: HTMLElement;
  protected rendered: boolean;

  constructor() {
    super();
    this.rendered = false;
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    if (value) {
      this.setAttribute('disabled', 'disabled');
    } else {
      this.removeAttribute('disabled');
    }
  }

  protected connectedCallback() {
    if (!this.rendered) {
      this.render();
      this.eventListeners();
      this.rendered = true;
    }
  }

  protected attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    this.attributeChanged(name, oldValue, newValue);
  }

  protected render() {
    if (this.template) {
      this.appendChild(this.template);
    }
  }

  protected async eventListeners() {}

  protected attributeChanged(name: string, oldValue: string, newValue: string) {}

  // protected attributeChanged() {}
  // disconnectedCallback() {}

  static template(html: string): DocumentFragment {
    const template = document.createElement('template');
    template.innerHTML = html;

    // console.log('---------------------------------------------------------------------------------------------------');
    // console.log(html.trim());
    // console.log('---------------------------------------------------------------------------------------------------');

    return template.content;
  }
}
