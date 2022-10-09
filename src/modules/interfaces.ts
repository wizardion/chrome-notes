interface HTMLCollectionFieldset {
  synchronization: HTMLFieldSetElement;
}

interface HTMLCollectionCheckbox {
  sync: HTMLInputElement;
  dev: HTMLInputElement;
}

interface HTMLCollectionInput {
  password: HTMLInputElement;
}

interface HTMLCollectionButton {
  generate: HTMLInputElement;
  back: HTMLInputElement;
  save: HTMLInputElement;
  cancel: HTMLInputElement;
  erase: HTMLLinkElement;
  printLogs: HTMLLinkElement;
  clearLogs: HTMLLinkElement;
}

interface HTMLCollectionBlock {
  views: NodeList;
  info: HTMLElement;
  keyInfo: HTMLElement;

  unlockMessage: HTMLSpanElement;
  passwordValidator: HTMLElement;

  maxItems: HTMLSpanElement;
  maxEach: HTMLSpanElement;
  maxBytes: HTMLSpanElement;
  locked: HTMLElement;
  lockTitle: HTMLElement;
  lockIndicator: HTMLElement;
  unlocked: HTMLElement;
  progressThumb: HTMLElement;
  syncedTime: HTMLElement;
  devInfo: HTMLElement;
}

interface IConfig {
  blocked: boolean,
  lock: boolean,
  processing: boolean
  internalKey: string
  periodInMinutes: number
};

export const config: IConfig = {
  blocked: false,
  lock: true,
  processing: false,
  internalKey: null,
  periodInMinutes: 1 //20
};

export class SettingsControls {
  public checkboxes: HTMLCollectionCheckbox;
  public inputs: HTMLCollectionInput;
  public buttons: HTMLCollectionButton;
  public blocks: HTMLCollectionBlock;
  public groups: HTMLCollectionFieldset;
  
  constructor () {
    this.groups = {
      synchronization: <HTMLFieldSetElement>document.getElementById('sync-group'),
    };
    this.checkboxes = {
      sync: <HTMLInputElement>document.getElementById('sync'),
      dev: <HTMLInputElement>document.getElementById('dev-mode')
    };
    this.inputs = {
      password: <HTMLInputElement>document.getElementById('id-key')
    };
    this.buttons = {
      generate: <HTMLInputElement>document.getElementById('generate'),
      back: <HTMLInputElement>document.getElementById('back'),
      save: <HTMLInputElement>document.getElementById('save-changes'),
      cancel: <HTMLInputElement>document.getElementById('cancel-save'),
      erase: <HTMLLinkElement>document.getElementById('erase-data'),
      printLogs: <HTMLLinkElement>document.getElementById('print-logs'),
      clearLogs: <HTMLLinkElement>document.getElementById('clear-logs'),
    };
    this.blocks = {
      views: <NodeList>document.querySelectorAll('input[name="views"]'),
      info: <HTMLElement>document.getElementById('info'),
      keyInfo: <HTMLElement>document.getElementById('key-info'),
      devInfo: <HTMLElement>document.getElementById('dev-info'),

      unlockMessage: <HTMLElement>document.getElementById('unlock-message'),
      passwordValidator: <HTMLElement>document.getElementById('validator-password'),
      progressThumb: <HTMLElement>document.getElementById('progress-thumb'),
      
      maxItems: <HTMLInputElement>document.getElementById('maxItems'),
      maxEach: <HTMLInputElement>document.getElementById('maxEach'),
      maxBytes: <HTMLInputElement>document.getElementById('maxBytes'),
      
      locked: <HTMLElement>document.getElementById('locked-icon'),
      lockTitle: <HTMLElement>document.getElementById('locked-title-indicator'),
      lockIndicator: <HTMLElement>document.getElementById('lock-indicator'),
      unlocked: <HTMLElement>document.getElementById('unlocked-icon'),
      syncedTime: <HTMLElement>document.getElementById('synced-time'),
    };
  }
}
