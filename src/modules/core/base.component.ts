/* 
  https://web.dev/custom-elements-v1/
*/
export class BaseElement extends HTMLElement {
  protected rendered: boolean;
  static observedAttributes = ['disabled'];

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

  }

  protected async eventListeners() {

  }

  protected attributeChanged(name: string, oldValue: string, newValue: string) {

  }

  // protected attributeChanged() {}
  // disconnectedCallback() {}

  static template(html: string): DocumentFragment {
    var template = document.createElement('template');
    template.innerHTML = html.trim();
    
    return template.content;
  }
}
