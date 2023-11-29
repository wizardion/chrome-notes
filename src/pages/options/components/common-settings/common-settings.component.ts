import { BaseElement, FormElement } from 'core/components';
import { ICommonSettingsForm } from './common-settings.model';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './common-settings.component.html'
});

export class CommonSettingsElement extends BaseElement {
  static readonly selector = 'common-settings';

  protected _mode: number;
  protected _editor: number;
  protected _expirationDays: number;
  protected event: Event;

  private form: FormElement<ICommonSettingsForm>;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.form = new FormElement({
      fieldset: this.template.querySelector('fieldset'),
      views: <NodeList> this.template.querySelectorAll('input[name="view"]'),
      editors: <NodeList> this.template.querySelectorAll('input[name="editor"]'),
      expirationDays: this.template.querySelector('select[name="expirationDays"]')
    });
  }

  protected async eventListeners() {
    this.event = new Event('settings:change');

    this.form.elements.expirationDays.addEventListener(
      'change', () => this.onExpirationDaysChange(this.form.elements.expirationDays)
    );

    for (let i = 0; i < this.form.elements.views.length; i++) {
      const item: HTMLInputElement = <HTMLInputElement> this.form.elements.views[i];

      item.addEventListener('change', () => this.onModeChange(item));
    }

    for (let i = 0; i < this.form.elements.editors.length; i++) {
      const item: HTMLInputElement = <HTMLInputElement> this.form.elements.editors[i];

      item.addEventListener('change', () => this.onEditorChange(item));
    }
  }

  protected onModeChange(item: HTMLInputElement) {
    this._mode = Number(item.value);
    this.dispatchEvent(this.event);
  }

  protected onEditorChange(item: HTMLInputElement) {
    this._editor = Number(item.value);
    this.dispatchEvent(this.event);
  }

  protected onExpirationDaysChange(item: HTMLSelectElement) {
    this._expirationDays = Number(item.value);
    this.dispatchEvent(this.event);
  }

  get mode(): number {
    return this._mode;
  }

  set mode(index: number) {
    for (let i = 0; i < this.form.elements.views.length; i++) {
      const item = <HTMLInputElement> this.form.elements.views[i];

      if (parseInt(item.value) === index) {
        item.checked = true;
        this._mode = index;

        return;
      }
    }
  }

  get editor(): number {
    return this._editor;
  }

  set editor(index: number) {
    for (let i = 0; i < this.form.elements.editors.length; i++) {
      const item = <HTMLInputElement> this.form.elements.editors[i];

      if (parseInt(item.value) === index) {
        item.checked = true;
        this._editor = index;

        return;
      }
    }
  }

  get expirationDays(): number {
    return this._expirationDays;
  }

  set expirationDays(value: number) {
    if (value) {
      this._expirationDays = value;
      this.form.elements.expirationDays.value = value.toString();
    }
  }
}
