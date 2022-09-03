interface HTMLCollectionCheckbox {
  sync: HTMLInputElement;
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
  // lock: HTMLLinkElement;
}

interface HTMLCollectionBlock {
  views: NodeList;
  info: HTMLElement;
  keyInfo: HTMLElement;

  unlockMessage: HTMLSpanElement;
  passwordValidator: HTMLElement;
  // keyValidator: HTMLElement,
  saveMessage: HTMLElement;

  maxItems: HTMLSpanElement;
  maxEach: HTMLSpanElement;
  maxBytes: HTMLSpanElement;
  locked: HTMLElement;
  unlocked: HTMLElement;
  progressBar: HTMLElement;
}

export class SettingsControls {
  public checkboxes: HTMLCollectionCheckbox;
  public inputs: HTMLCollectionInput;
  public buttons: HTMLCollectionButton;
  public blocks: HTMLCollectionBlock;
  
  constructor () {
    this.checkboxes = {
      sync: <HTMLInputElement>document.getElementById('sync')
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
      // lock: <HTMLLinkElement>document.getElementById('lock-data'),
    };
    this.blocks = {
      views: <NodeList>document.querySelectorAll('input[name="views"]'),
      info: <HTMLElement>document.getElementById('info'),
      keyInfo: <HTMLElement>document.getElementById('key-info'),

      unlockMessage: <HTMLElement>document.getElementById('unlock-message'),
      passwordValidator: <HTMLElement>document.getElementById('validator-password'),
      progressBar: <HTMLElement>document.getElementById('progress-thumb'),
      // keyValidator: <HTMLElement>document.getElementById('validator-key'),
      saveMessage: <HTMLElement>document.getElementById('save-changes-block'),
      
      maxItems: <HTMLInputElement>document.getElementById('maxItems'),
      maxEach: <HTMLInputElement>document.getElementById('maxEach'),
      maxBytes: <HTMLInputElement>document.getElementById('maxBytes'),
      
      locked: <HTMLElement>document.getElementById('locked-icon'),
      unlocked: <HTMLElement>document.getElementById('unlocked-icon'),
    };
  }
}
