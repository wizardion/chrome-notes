import { BaseElement } from 'core/components';
import { storage } from 'core/services';
import { LoggerService } from 'modules/logger';
// import { db } from 'modules/db';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './template.html'
});

export class DevModeElement extends BaseElement {
  static readonly selector = 'dev-mode-info';
  static observedAttributes = ['disabled', 'default-index'];

  protected fieldset: HTMLFieldSetElement;
  protected mode: HTMLInputElement;
  protected print: HTMLLinkElement;
  protected clean: HTMLLinkElement;
  protected cacheEmpty: HTMLLinkElement;
  // protected cacheClear: HTMLLinkElement;
  protected cachePrint: HTMLLinkElement;
  protected info: HTMLElement;
  protected event: Event;


  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.fieldset = this.template.querySelector('fieldset');
    this.mode = this.template.querySelector('input[name="mode"]');
    this.info = this.template.querySelector('div[name="dev-info"]');
    this.print = this.template.querySelector('a[name="print-logs"]');
    this.clean = this.template.querySelector('a[name="clear-logs"]');
    this.cachePrint = this.template.querySelector('a[name="print-cache"]');
    // this.cacheClear = this.template.querySelector('a[name="clear-cache"]');
    this.cacheEmpty = this.template.querySelector('a[name="empty-cache"]');
    this.info.hidden = true;
  }

  protected async eventListeners() {
    this.event = new Event('mode:change');
    this.mode.onchange = () => this.modeChanged();

    this.print.onclick = (e) => { e.preventDefault(); this.printLogs(); };

    this.clean.onclick = (e) => { e.preventDefault(); this.clearLogs(); };

    this.cacheEmpty.onclick = (e) => { e.preventDefault(); this.clearCache(); };

    this.cachePrint.onclick = (e) => { e.preventDefault(); this.printCache(); };
  }

  protected attributeChanged(name: string) {
    if (name === 'disabled') {
      if (this.disabled) {
        this.fieldset.setAttribute('disabled', 'disabled');
      } else {
        this.fieldset.removeAttribute('disabled');
      }
    }
  }

  protected modeChanged() {
    this.info.hidden = !this.mode.checked;
    this.dispatchEvent(this.event);
  }

  protected async printLogs() {
    // const cache = await storage.cached.get();

    LoggerService.getAll().then((logs) => {
      console.clear();

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];

        // if (['base.ts', 'popup.ts', 'db.note.ts'].indexOf(log.name) >= 0) {
        LoggerService.print(log);
      }

      // Logger.print({
      //   name: 'print-logs',
      //   color: null,
      //   time: new Date().getTime(),
      //   type: ILogType.Info,
      //   data: JSON.stringify(['printLogs.cache', cache])
      // });
    });
  }

  protected clearLogs() {
    LoggerService.clear();
    console.clear();
  }

  // protected async clearCache() {
  //   if (window.confirm('Please confirm to clear dynamic cached values.\nThe page will be reloaded.')) {
  //     await storage.cached.clear();
  //     document.location.reload();
  //   }
  // }

  protected async clearCache() {
    if (window.confirm('Please confirm the certainty of clearing all dynamic and permanent cached values.' +
                       '\nThe page will be reloaded.')) {
      // const data = await load();

      // for (let i = 0; i < data.length; i++) {
      //   const item = data[i];

      //   item.cState = [0, 0];
      //   enqueue(item, 'update');
      // }

      // await dequeue();

      await storage.global.clear();
      // await storage.cached.set('list', data);
      document.location.reload();
    }
  }

  protected async printCache() {
    console.log((await storage.cached.get()));
  }

  get enabled(): boolean {
    return this.mode.checked;
  }

  set enabled(value: boolean) {
    this.mode.checked = value;
    this.info.hidden = !value;
  }
}
