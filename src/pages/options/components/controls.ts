// import * as interfaces from "./interfaces";

// export const config: interfaces.IConfig = {
//   blocked: false,
//   lock: true,
//   processing: false,
//   internalKey: null,
//   periodInMinutes: 3, //20
//   // quotaBytes: chrome.storage.sync.QUOTA_BYTES
// };

// export class HtmlControls {
//   public checkboxes: interfaces.HTMLCollectionCheckbox;
//   public inputs: interfaces.HTMLCollectionInput;
//   public buttons: interfaces.HTMLCollectionButton;
//   public blocks: interfaces.HTMLCollectionBlock;
//   public groups: interfaces.HTMLCollectionFieldset;
//   // public syncInfo: interfaces.HTMLCollectionSyncInfo;
//   private timer: NodeJS.Timeout;
//   private messenger: HTMLDivElement;
  
//   constructor () {
//     this.messenger = <HTMLDivElement>document.getElementById('message');

//     this.groups = {
//       synchronization: <HTMLFieldSetElement>document.getElementById('sync-group'),
//     };
//     this.checkboxes = {
//       sync: <HTMLInputElement>document.getElementById('sync'),
//       dev: <HTMLInputElement>document.getElementById('dev-mode')
//     };
//     this.inputs = {
//       password: <HTMLInputElement>document.getElementById('id-key')
//     };
//     this.buttons = {
//       generate: <HTMLInputElement>document.getElementById('generate'),
//       back: <HTMLInputElement>document.getElementById('back'),
//       save: <HTMLInputElement>document.getElementById('save-changes'),
//       cancel: <HTMLInputElement>document.getElementById('cancel-save'),
//       erase: <HTMLLinkElement>document.getElementById('erase-data'),
//       printLogs: <HTMLLinkElement>document.getElementById('print-logs'),
//       clearLogs: <HTMLLinkElement>document.getElementById('clear-logs'),
//     };
//     this.blocks = {
//       views: <NodeList>document.querySelectorAll('input[name="views"]'),
//       sync: {
//         // info:  <HTMLElement>document.getElementById('sync-info'),
//         controls: {
//           info: <HTMLElement>document.getElementById('sync-mode-info'),
//           modes: <NodeList>document.querySelectorAll('input[name="syncMode"]'),
//         },
//         simple: <HTMLElement>document.getElementById('simple-sync-info'),
//         drive: <HTMLElement>document.getElementById('drive-sync-info')
//       },
//       // devInfo: <HTMLElement>document.getElementById('dev-info'),

//       unlockMessage: <HTMLElement>document.getElementById('unlock-message'),
//       passwordValidator: <HTMLElement>document.getElementById('validator-password'),
//       progressThumb: <HTMLElement>document.getElementById('progress-thumb'),
      
//       maxItems: <HTMLInputElement>document.getElementById('maxItems'),
//       maxEach: <HTMLInputElement>document.getElementById('maxEach'),
//       maxBytes: <HTMLInputElement>document.getElementById('maxBytes'),
      
//       locked: <HTMLElement>document.getElementById('locked-icon'),
//       lockTitle: <HTMLElement>document.getElementById('locked-title-indicator'),
//       lockIndicator: <HTMLElement>document.getElementById('lock-indicator'),
//       unlocked: <HTMLElement>document.getElementById('unlocked-icon'),
//       syncedTime: <HTMLElement>document.getElementById('synced-time'),
//     };
//   }

//   private addListener(element: HTMLElement, type: string, fn: (element: HTMLElement) => void) {
//     element.addEventListener(type, (e: Event) => {
//       let disabled = element.getAttribute('disabled');

//       if (!disabled) {
//         fn(element);
//       }

//       e.preventDefault();
//     });
//   }

//   private checkRadioButton(list: NodeList, value: string) {
//     for (let i = 0; i < list.length; i++) {
//       const item: HTMLInputElement = <HTMLInputElement>list[i];
  
//       if (item.value === value) {
//         item.checked = true;
//       }
//     }
//   }

//   public addEventListener(element: (HTMLElement|NodeList), type: string, fn: (element: HTMLElement) => void) {
//     if (element instanceof HTMLElement) {
//       this.addListener(element, type, fn);
//     }

//     if (element instanceof NodeList) {
//       let list: NodeList = element;

//       for (let i = 0; i < list.length; i++) {
//         const item: HTMLInputElement = <HTMLInputElement>list[i];

//         this.addListener(item, type, fn);
//       }
//     }
//   }

//   public toggleSync(enabled?: boolean, sync?: boolean) {
//     // if (enabled) {
//     //   this.blocks.sync.info.classList.remove('hidden');
//     //   this.blocks.sync.controls.info.classList.remove('hidden');
//     // } else {
//     //   this.blocks.sync.info.classList.add('hidden');
//     //   this.blocks.sync.controls.info.classList.add('hidden');
//     // }

//     // if (sync) {
//     //   this.checkboxes.sync.checked = enabled;
//     // }
//   }

//   public toggleSyncMode(value?: number, sync?: boolean) {
//     // if (value === 1) {
//     //   this.blocks.sync.simple.classList.remove('hidden');
//     //   this.blocks.sync.drive.classList.add('hidden');
//     // }

//     // if (value === 2) {
//     //   this.blocks.sync.simple.classList.add('hidden');
//     //   this.blocks.sync.drive.classList.remove('hidden');
//     // }

//     // if (sync) {
//     //   this.checkRadioButton(this.blocks.sync.controls.modes, value.toString());
//     // }
//   }

//   public toggleView(value?: number, sync?: boolean) {
//     if (sync) {
//       this.checkRadioButton(this.blocks.views, value.toString());
//     }
//   }

//   public toggleDevMode(value?: boolean, sync?: boolean) {
//     // if (value === true) {
//     //   this.blocks.devInfo.classList.remove('hidden');
//     // } else {
//     //   this.blocks.devInfo.classList.add('hidden');
//     // }

//     // if (sync) {
//     //   this.checkboxes.dev.checked = value;
//     // }
//   }

//   public error(value: string) {
//     this.messenger.innerText = value;
//     this.messenger.classList.add('error-message');
//     this.messenger.classList.remove('hidden');

//     clearTimeout(this.timer);
//     this.timer = setTimeout(() => this.messenger.classList.add('hidden'), 5000);
//   }

//   public hideMessage() {
//     clearTimeout(this.timer);
//     this.messenger.classList.add('hidden');
//   }
// }

