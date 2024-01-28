import { BaseElement, FormElement } from 'core/components';
import { ICommonSettingsForm } from './common-settings.model';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './common-settings.component.html'
});

export class CommonSettingsElement extends BaseElement {
  static readonly selector = 'common-settings';

  protected _mode: number;
  protected _editor: number;
  protected _popupSize: number;
  protected _expirationDays: number;
  protected _appearance: number;
  protected event: Event;

  private form: FormElement<ICommonSettingsForm>;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.form = new FormElement<ICommonSettingsForm>({
      fieldset: this.template.querySelector('fieldset'),
      views: <NodeList> this.template.querySelectorAll('input[name="view"]'),
      editors: <NodeList> this.template.querySelectorAll('input[name="editor"]'),
      popupOptions: <HTMLElement> this.template.querySelector('div[name="popup-options"]'),
      popupSize: <NodeList> this.template.querySelectorAll('input[name="popup-size"]'),
      appearance: <NodeList> this.template.querySelectorAll('input[name="appearance"]'),
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

    for (let i = 0; i < this.form.elements.popupSize.length; i++) {
      const item: HTMLInputElement = <HTMLInputElement> this.form.elements.popupSize[i];

      item.addEventListener('change', () => this.onPopupChange(item));
    }

    for (let i = 0; i < this.form.elements.appearance.length; i++) {
      const item: HTMLInputElement = <HTMLInputElement> this.form.elements.appearance[i];

      item.addEventListener('change', () => this.onAppearanceChange(item));
    }
  }

  protected onModeChange(item: HTMLInputElement) {
    this._mode = Number(item.value);
    this.form.elements.popupOptions.hidden = (this._mode >= 3);
    this.dispatchEvent(this.event);
  }

  protected onEditorChange(item: HTMLInputElement) {
    this._editor = Number(item.value);
    this.dispatchEvent(this.event);
  }

  protected onPopupChange(item: HTMLInputElement) {
    this._popupSize = Number(item.value);
    this.dispatchEvent(this.event);
  }

  protected onAppearanceChange(item: HTMLInputElement) {
    this._appearance = Number(item.value);
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
        this.form.elements.popupOptions.hidden = (this._mode >= 3);

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

  get appearance(): number {
    return this._appearance;
  }

  set appearance(index: number) {
    for (let i = 0; i < this.form.elements.appearance.length; i++) {
      const item = <HTMLInputElement> this.form.elements.appearance[i];

      if (parseInt(item.value) === index) {
        item.checked = true;
        this._appearance = index;

        return;
      }
    }
  }

  get popupSize(): number {
    return this._popupSize;
  }

  set popupSize(index: number) {
    for (let i = 0; i < this.form.elements.popupSize.length; i++) {
      const item = <HTMLInputElement> this.form.elements.popupSize[i];

      if (parseInt(item.value) === index) {
        item.checked = true;
        this._popupSize = index;

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
