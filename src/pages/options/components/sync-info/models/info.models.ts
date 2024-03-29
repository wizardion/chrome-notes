import { PasswordElement } from '../../passwords/password.component';
import { ProgressElement } from '../../progress-bar/progress.component';


export type IDecorator = () => Promise<boolean>;


export interface ISyncInfoForm {
  info: HTMLFieldSetElement;
  passphrase: PasswordElement;
  progressBar: ProgressElement;
  error: HTMLElement;

  checkboxes: {
    sync: HTMLInputElement;
    encrypt: HTMLInputElement;
  };
  buttons: {
    submit: HTMLInputElement;
    authorize: HTMLInputElement;
    deauthorize: HTMLInputElement;
  };
  sections: {
    auth: HTMLFieldSetElement;
    submit: HTMLFieldSetElement;
    encryption: HTMLFieldSetElement;
  };
}

export interface IResponseDetails {
  message: string;
  locked: boolean;
  error: boolean;
}
