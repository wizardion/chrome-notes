/*
  https://web.dev/custom-elements-v1/
*/
export abstract class BaseElement extends HTMLElement {
  static readonly selector: string;
  static observedAttributes = ['disabled'];

  protected template?: HTMLElement;
  protected rendered: boolean;

  constructor() {
    super();
    this.rendered = false;
  }

  protected eventListeners?(): void;
  protected attributeChanged?(name: string, oldValue: string, newValue: string): void;

  protected connectedCallback() {
    if (!this.rendered) {
      this.render();
      this.eventListeners?.();
      this.rendered = true;
    }
  }

  protected attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    this.attributeChanged?.(name, oldValue, newValue);
  }

  protected render() {
    if (this.template) {
      this.appendChild(this.template);
    }
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

  static component(config: {templateUrl: string}): DocumentFragment {
    const template = document.createElement('template');

    template.innerHTML = config.templateUrl;

    return template.content;
  }
}
