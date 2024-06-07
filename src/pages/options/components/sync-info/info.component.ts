import { Cloud } from 'modules/sync/cloud';
import { BaseElement } from 'core/components';
import { IdentityInfo, TokenSecretDenied } from 'modules/sync/components/models/sync.models';
import { ISyncInfoForm, IResponseDetails } from './models/info.models';
import { LoggerService } from 'modules/logger';
import { IDecorator } from 'core/models/code.models';
import { db } from 'modules/db';


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
  private _fileId: string;
  private _encrypted: boolean;
  private _passphrase: string;
  private _locked: boolean;
  private _response: IResponseDetails;

  constructor() {
    super();

    this.template = <HTMLElement>template.cloneNode(true);
    this.form = {
      info: this.template.querySelector('[name="sync-info"]'),
      error: this.template.querySelector('[name="error"]'),
      passphrase: this.template.querySelector('user-password'),
      progressBar: this.template.querySelector('progress-bar'),
      checkboxes: {
        sync: this.template.querySelector('[name="sync-enabled"]'),
        encrypt: this.template.querySelector('[name="encryption-enabled"]'),
      },
      buttons: {
        authorize: this.template.querySelector('[name="authorize"]'),
        deauthorize: this.template.querySelector('[name="deauthorize"]'),
        submit: this.template.querySelector('[name="submit"]'),
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
  }

  protected attributeChanged() {
    const disabled: boolean = this.disabled;

    this.form.info.disabled = disabled;
  }

  protected async enabledChanged() {
    const enabled = this.form.checkboxes.sync.checked;

    if (this.token && !enabled) {
      const value = window.confirm('Would you like to remove data from cloud?\n');

      if (value) {
        await this.submit(this.removeCloudDecorator());
      } else {
        await this.submit(this.deauthorizeDecorator());
      }
    }

    this.enabled = enabled;
    this.dispatchEvent(this.event);
  }

  protected async encryptedChanged() {
    const encrypted: boolean = this.form.checkboxes.encrypt.checked;

    if (!encrypted && !this._locked && this._token && this._passphrase) {
      const value = window.prompt('Please enter your secret key to confirm disabling data encryption.\n');

      if (value !== this._passphrase) {
        this.form.checkboxes.encrypt.checked = true;

        return;
      }

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
      await this.submit(this.syncDecorator());
      this.dispatchEvent(this.event);
    }
  }

  protected syncDecorator(): IDecorator {
    return async () => {
      await Cloud.wait();

      const info = await Cloud.sync({
        fileId: this._fileId,
        token: this._token,
        enabled: this._enabled,
        passphrase: this._passphrase,
        encrypted: this._encrypted,
        locked: this._locked,
      });

      return this.updateInfo(info);
    };
  }

  protected encryptDecorator(passphrase: string): IDecorator {
    return async () => {
      await Cloud.wait();

      return Cloud.encrypt(this._passphrase || '', passphrase);
    };
  }

  protected verifyIdentity(passphrase: string): IDecorator<IdentityInfo | null> {
    return async () => {
      await Cloud.wait();

      return Cloud.verifyIdentity({
        fileId: this._fileId,
        token: this._token,
        passphrase: passphrase,
        enabled: this._enabled,
        encrypted: this._encrypted,
        locked: this._locked,
      });
    };
  }

  protected authorizeDecorator(): IDecorator {
    return async () => {
      const verify = this.verifyIdentity(this._passphrase);
      const sync = this.syncDecorator();
      const info = await verify();

      if (info?.fileId) {
        await db.desync();
        this.updateInfo(info);

        return sync();
      }

      return false;
    };
  }

  protected async authorize() {
    this.promise = true;

    try {
      if (this.checkValidity()) {
        this.token = await Cloud.authorize();

        if (!await this.submit(this.authorizeDecorator())) {
          if (!this._response.error || this._response.locked) {
            this.locked = true;
            this.form.passphrase.focus();
            this.message = this._response.message || 'Invalid encryption passphrase.';

            return this.dispatchEvent(this.event);
          }

          this.token = null;
        } else {
          this.dispatchEvent(this.event);
        }
      } else {
        this.message = 'Please enter all required fields.';
      }
    } catch (error) {
      this.message = error.message;
    } finally {
      this.promise = false;
    }
  }

  protected async deauthorize() {
    const value = window.confirm('Would you like to remove data from cloud?\n');

    if (value) {
      await this.submit(this.removeCloudDecorator());
      this.enabled = false;
    } else {
      await this.submit(this.deauthorizeDecorator());
    }

    this.dispatchEvent(this.event);
  }

  protected deauthorizeDecorator(): IDecorator {
    return async () => {
      await Cloud.deauthorize(this.token);
      this.fileId = null;
      this.token = null;

      return true;
    };
  }

  protected removeCloudDecorator(): IDecorator {
    return async () => {
      await Cloud.remove();
      await LoggerService.clear();

      this.token = null;
      this.fileId = null;
      this.encrypted = false;
      this.passphrase = null;

      return true;
    };
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

  get fileId(): string {
    return this._fileId;
  }

  set fileId(value: string) {
    this._fileId = value;
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

  private updateInfo(info: IdentityInfo): boolean {
    this.fileId = info.fileId;
    this.token = info.token;
    this.passphrase = info.passphrase;
    this.enabled = info.enabled;
    this.encrypted = info.encrypted;
    this.locked = info.locked;

    return !!info.fileId;
  }

  private async submit<T = boolean>(decorator: IDecorator<T>): Promise<T | null> {
    let result: T = null;

    try {
      this.promise = true;
      this.form.checkboxes.sync.disabled = true;
      this.form.progressBar.spinning = true;

      result = await decorator();

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
      this.form.checkboxes.sync.disabled = false;
    }

    return result;
  }
}
