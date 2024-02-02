import { Cloud } from 'modules/sync/cloud';
import { BaseElement } from 'core/components';
import { TokenSecretDenied } from 'modules/sync/components/interfaces';
import { ISyncInfoForm, IDecorator, IResponseDetails } from './interfaces';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './template.html'
});

export class SyncInfoElement extends BaseElement {
  static readonly selector = 'sync-info';

  protected form: ISyncInfoForm;
  protected event: Event;

  private _token: string;
  private _enabled: boolean;
  private _promise: boolean;
  private _encrypted: boolean;
  private _passphrase: string;
  private _locked: boolean;
  private _response: IResponseDetails;

  constructor() {
    super();

    this.template = <HTMLElement>template.cloneNode(true);
    this.form = {
      info: this.template.querySelector('fieldset[name="sync-info"]'),
      error: this.template.querySelector('div[name="error"]'),
      passphrase: this.template.querySelector('user-password[name="encryption-key"]'),
      progressBar: this.template.querySelector('progress-bar'),
      checkboxes: {
        sync: this.template.querySelector('input[name="sync-enabled"]'),
        encrypt: this.template.querySelector('input[name="encryption-enabled"]'),
      },
      buttons: {
        authorize: this.template.querySelector('button[name="authorize"]'),
        deauthorize: this.template.querySelector('button[name="deauthorize"]'),
        submit: this.template.querySelector('button[name="submit"]'),
      },
      sections: {
        auth: this.template.querySelector('fieldset[name="drive-info"]'),
        encryption: this.template.querySelector('fieldset[name="encryption-info"]'),
        submit: this.template.querySelector('fieldset[name="submit-info"]'),
      },
    };

    this._promise = false;
    this._encrypted = false;
    this.form.info.hidden = true;
    this.form.buttons.deauthorize.disabled = true;
    this.form.checkboxes.encrypt.disabled = true;
    this.form.sections.encryption.disabled = true;

    this.form.buttons.submit.disabled = true;
    this._response = { message: null, locked: false, error: false };
    this.promise = false;
  }

  protected async eventListeners() {
    this.event = new Event('sync-info:change');

    this.form.checkboxes.encrypt.parentElement.onmousedown = (e) => e.preventDefault();

    this.form.buttons.submit.onclick = () => this.submit(this.syncDecorator());
    this.form.buttons.authorize.onclick = () => this.authorize();
    this.form.checkboxes.sync.onchange = () => this.enabledChanged();
    this.form.buttons.deauthorize.onclick = () => this.deauthorize();
    this.form.checkboxes.encrypt.onchange = () => this.encryptedChanged();

    this.form.passphrase.addEventListener('password:change', () => this.passphraseChanged());
    // this.form.passphrase.addEventListener('password:dirtiness', () => this.passwordDirtinessChanged());

    // this.promise = true;
    // this.form.progressBar.spinning = true;
  }

  protected attributeChanged() {
    const disabled: boolean = this.disabled;

    this.form.info.disabled = disabled;
  }

  protected enabledChanged() {
    this.enabled = this.form.checkboxes.sync.checked;

    this.dispatchEvent(this.event);
  }

  protected async encryptedChanged() {
    const encrypted: boolean = this.form.checkboxes.encrypt.checked;

    if (!encrypted && !this._locked && this._token && this._passphrase) {
      this.form.checkboxes.encrypt.checked = true;

      if (!(await this.submit(this.encryptDecorator('')))) {
        return;
      }

      this.passphrase = null;
    }

    this.encrypted = encrypted;

    if (encrypted && !this._passphrase) {
      this.form.passphrase.checkValidity();

      return this.form.passphrase.focus();
    } else if (!encrypted) {
      this.form.passphrase.reset();
    }

    this.dispatchEvent(this.event);
  }

  protected async passphraseChanged() {
    const passphrase = this.form.passphrase.value;

    if (!this.locked && this._enabled && this._encrypted) {
      if (await this.submit(this.encryptDecorator(passphrase))) {
        this.passphrase = passphrase;
        this.dispatchEvent(this.event);
      }

      return;
    }

    if (this.locked) {
      if (!(await this.submit(this.verifyIdentity(passphrase)))) {
        if (!this._response.error || this._response.locked) {
          this.locked = true;
          this.form.passphrase.focus();
          this.message = this._response.message || 'Invalid encryption passphrase.';

          return this.dispatchEvent(this.event);
        }

        return;
      }

      this.passphrase = passphrase;
      this.locked = false;
      this.dispatchEvent(this.event);
      await this.submit(this.syncDecorator());
    }
  }

  protected syncDecorator(): IDecorator {
    return async () => {
      await Cloud.wait();

      return Cloud.sync();
    };
  }

  protected encryptDecorator(passphrase: string): IDecorator {
    return async () => {
      await Cloud.wait();

      return Cloud.encrypt(this._passphrase || '', passphrase);
    };
  }

  protected verifyIdentity(passphrase: string): IDecorator {
    return async () => {
      await Cloud.wait();

      return Cloud.verifyIdentity({
        id: null,
        enabled: this._enabled,
        token: this._token,
        passphrase: passphrase,
        encrypted: this._encrypted,
        locked: this._locked,
      });
    };
  }

  protected async authorize() {
    this.promise = true;

    try {
      if (this.checkValidity()) {
        this.token = await Cloud.authorize();

        if (!(await this.submit(this.verifyIdentity(this._passphrase)))) {
          if (!this._response.error || this._response.locked) {
            this.locked = true;
            this.form.passphrase.focus();
            this.message = this._response.message || 'Invalid encryption passphrase.';

            return this.dispatchEvent(this.event);
          }

          this.token = null;

          return;
        }

        this.dispatchEvent(this.event);
        await this.submit(this.syncDecorator());
      } else {
        this.message = 'Form is not valid.';
      }
    } catch (error) {
      this.message = error;
    } finally {
      this.promise = false;
    }
  }

  protected async deauthorize() {
    this.promise = true;

    try {
      await Cloud.deauthorize(this.token);
      this.token = null;
      this.dispatchEvent(this.event);
    } catch (error) {
      this.message = error;
    } finally {
      this.promise = false;
    }
  }

  public get promise(): boolean {
    return this._promise;
  }

  public set promise(value: boolean) {
    this._promise = value;
    this.form.info.disabled = value;
    this.form.progressBar.hidden = !value;

    if (value) {
      this.message = '';
    }
  }

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(value: boolean) {
    this._enabled = value;
    this.form.info.hidden = !value;
    this.form.checkboxes.sync.checked = value;
  }

  get token(): string {
    return this._token;
  }

  set token(value: string) {
    this._token = value;
    this.validateControls();
  }

  get encrypted(): boolean {
    return this._encrypted;
  }

  set encrypted(value: boolean) {
    this._encrypted = value;

    this.form.checkboxes.encrypt.checked = value;
    this.validateControls();
  }

  get passphrase(): string {
    return this._passphrase;
  }

  set passphrase(value: string) {
    this._passphrase = value;
    this.form.passphrase.value = value;
    this.validateControls();
  }

  get locked(): boolean {
    return this._locked;
  }

  set locked(value: boolean) {
    this._locked = value;
    this.validateControls();
  }

  get message(): string {
    return this.form.error.innerText;
  }

  set message(value: string) {
    this.form.error.innerText = value || '';
  }

  public checkValidity(): boolean {
    return !!(
      !this._enabled ||
      !this._token ||
      !this._encrypted ||
      (this._passphrase && this.form.passphrase.checkValidity())
    );
  }

  private validateControls() {
    this._encrypted = this._locked || this._encrypted;
    this.form.checkboxes.encrypt.checked = this._locked || this.form.checkboxes.encrypt.checked;

    this.form.buttons.authorize.disabled = !!this._token;
    this.form.buttons.deauthorize.disabled = !this._token;
    this.form.checkboxes.encrypt.disabled = !this._token || this._locked;

    this.form.sections.encryption.disabled = !this._token || (!this._locked && !this._encrypted);
    this.form.passphrase.required = this._locked || (this._token && this._encrypted);
    this.form.passphrase.disabled = !this._token || (!this._locked && !this._encrypted);

    this.form.passphrase.locked = this._locked;
    this.form.buttons.submit.disabled = this._locked || !this._token || (this._encrypted && !this._passphrase);
  }

  private async submit(decorator: IDecorator): Promise<boolean> {
    let successful = false;

    try {
      this.promise = true;
      this.form.progressBar.spinning = true;

      successful = await decorator();
      this._response = { message: null, locked: false, error: false };
    } catch (error) {
      this._response = {
        error: true,
        message: error.message || error,
        locked: error instanceof TokenSecretDenied,
      };
    } finally {
      await this.form.progressBar.finish(100);
      this.promise = false;
      this.message = this._response.message;
      this.locked = this._response.locked || this.locked;
    }

    return successful;
  }
}
