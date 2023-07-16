import {BaseElement} from 'modules/core/base.component';
import {Encryptor} from 'modules/encryption/encryptor';

const template:DocumentFragment = BaseElement.template(require('html-loader!./template.html').default);


export class PasswordElement extends BaseElement {
  static observedAttributes = ['disabled', 'required'];

  private _locked: boolean;
  protected template: HTMLElement;
  protected generate: HTMLInputElement;
  protected lockedMessage: HTMLElement;
  protected input: HTMLInputElement;
  protected save: HTMLInputElement;
  protected cancel: HTMLInputElement;
  protected lockIndicator: SVGElement;
  protected validator: HTMLElement;
  protected fieldset: HTMLFieldSetElement;
  protected initial: string;
  protected event: Event;
  protected dirtinessEvent: Event;

  constructor() {
    super();

    this.template = <HTMLElement>template.cloneNode(true)
    this.generate = this.template.querySelector('input[name="generate"]');
    this.lockedMessage = this.template.querySelector('span[name="locked-message"]');
    this.input = this.template.querySelector('input[name="password-key"]');
    this.save = this.template.querySelector('input[name="save-changes"]');
    this.cancel = this.template.querySelector('input[name="cancel-changes"]');
    this.lockIndicator = this.template.querySelector('input[name="lock-indicator"]');
    this.validator = this.template.querySelector('div[name="validator-password"]');
    this.fieldset = this.template.querySelector('fieldset');
    this.initial = '';
  }

  get value(): string {
    return this.input.value.length && this.input.value || undefined;
  }

  set value(value: string) {
    this.initial = value || '';
    this.input.value = this.initial;
    this.setInputType(!value);
  }

  get required(): boolean {
    return this.input.hasAttribute('required');
  }

  set required(value: boolean) {
    if (value) {
      this.input.setAttribute('required', '');
    } else {
      this.input.removeAttribute('required');
    }
  }

  get dirty(): boolean {
    return this.initial !== this.input.value;
  }

  get locked(): boolean {
    return this._locked;
  }

  set locked(value: boolean) {
    this._locked = value;
    this.save.value = value ? 'Unlock' : 'Save';
    this.generate.disabled = value;

    if (value) {
      this.lockedMessage.classList.remove('hidden');
    } else {
      this.lockedMessage.classList.add('hidden');
    }
  }

  focus() {
    this.input.focus();
  }

  checkValidity(): boolean {
    const valid = this.disabled || (!this.required && !this.dirty) || this.input.checkValidity();
    // const valid: boolean = (!this.required || this.disabled) && (!this.input.value.length || this.input.checkValidity()) ||
    //                         this.required && (!!this.input.value.length && this.input.checkValidity());
    this.validator.innerText = !valid ? this.input.validationMessage : '';
    return valid;
  }

  reset() {
    const dirty = this.dirty;

    this.input.value = this.initial;
    this.save.disabled = true;
    this.cancel.disabled = true;
    this.validator.innerText = '';

    if (!this.disabled && !this.initial.length) {
      this.input.focus();
      this.checkValidity();
    } else {
      this.input.blur();
      this.setInputType();
    }

    if (dirty) {
      this.dispatchEvent(this.dirtinessEvent);
    }
  }

  protected render() {
    this.appendChild(this.template);
  }

  protected async eventListeners() {
    this.event = new Event('password:change');
    this.dirtinessEvent = new Event('password:dirtiness');
    
    this.generate.onmousedown = (e) => e.preventDefault();
    this.save.onmousedown = (e) => e.preventDefault();
    this.cancel.onmousedown = (e) => e.preventDefault();
    
    this.generate.onclick = () => this.generatePassword()
    this.cancel.onclick = () => this.reset();
    this.save.onclick = () => this.saveChanges();

    this.input.oninput = () => this.inputChanged();
    this.input.onfocus = () => this.setInputType(true);
    this.input.onblur = () => this.setInputType(false);
  }

  protected setInputType(focused: boolean = false) {
    this.input.type = (!focused && this.input.value.length && !this.dirty && this.checkValidity())? 'password' : 'text';
  }

  protected attributeChanged(name: string, oldValue: string, newValue: string) {
    if (name === 'disabled') {
      if (this.disabled) {
        this.fieldset.setAttribute('disabled', 'disabled');
      } else {
        this.fieldset.removeAttribute('disabled');
      }
    }

    if (name === 'required') {
      this.required = newValue !== null;
    }
  }

  protected async generatePassword() {
    var key: string = await Encryptor.generateKey();
    var index = Math.floor(Math.random() * key.length - 1);

    this.input.value = [key.slice(0, index), '-', key.slice(index)].join('');
    this.validator.innerText = '';
    this.save.disabled = false;
    this.cancel.disabled = false;

    this.input.focus();
    this.dispatchEvent(this.dirtinessEvent);
  }

  protected inputChanged() {
    this.cancel.disabled = !this.dirty;
    this.save.disabled = !this.input.validity.valid || !this.dirty;
    this.validator.innerText = this.input.validationMessage;

    this.dispatchEvent(this.dirtinessEvent);
  };

  protected async saveChanges() {
    if (await this.checkValidity() && await Encryptor.validate(this.input.value)) {
      this.initial = this.input.value;

      this.save.disabled = true;
      this.cancel.disabled = true;

      this.input.blur();
      this.setInputType();
      this.dispatchEvent(this.event);
    } else {
      this.input.setCustomValidity('Your password entered is not valid for encrypting.');
      this.validator.innerText = this.input.validationMessage;
    }
  };
}
