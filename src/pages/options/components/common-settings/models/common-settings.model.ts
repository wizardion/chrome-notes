import { ProgressElement } from '../../progress-bar/progress.component';


export interface ICommonSettingsForm {
  fieldset: HTMLFieldSetElement;
  views: NodeList;
  editors: NodeList;
  popupSize: NodeList;
  appearance: NodeList;
  popupOptions: HTMLElement;
  expirationDays: HTMLSelectElement;
  // progressBar: ProgressElement;
}
