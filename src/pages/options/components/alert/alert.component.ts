import { BaseElement } from 'core/components';
import { LocalStorageService } from 'core/services/local';
import { getSettings } from 'modules/settings';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './alert.component.html'
});

export class AlertElement extends BaseElement {
  static readonly selector = 'alert-message';

  private message: HTMLDivElement;
  private close: HTMLButtonElement;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.message = this.template.querySelector('[name="message"]');
    this.close = this.template.querySelector('[name="hide-alert"]');
  }

  protected eventListeners(): void {
    this.close.addEventListener('click', async () => this.hideMessage());
  }

  async hideMessage() {
    const settings = await getSettings();

    this.hidden = true;
    settings.error = null;
    this.message.parentElement.classList.remove('error');

    return LocalStorageService.set('settings', settings);
  }

  set error(value: string) {
    this.message.innerText = `Oops, something's wrong. It says ${value.toLowerCase()} :(`;
    this.hidden = !value;

    if (!this.message.parentElement.classList.contains('')) {
      this.message.parentElement.classList.add('error');
    }
  }
}
