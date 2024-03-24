import { BaseElement } from 'core/components';
import { storage } from 'core/services';
import { LoggerService } from 'modules/logger';
import { IDBNote, db } from 'modules/db';


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
  protected cachePrint: HTMLLinkElement;
  protected dataPrint: HTMLLinkElement;
  protected dataEmpty: HTMLLinkElement;
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
    this.cacheEmpty = this.template.querySelector('a[name="empty-cache"]');
    this.dataPrint = this.template.querySelector('a[name="print-db"]');
    this.dataEmpty = this.template.querySelector('a[name="empty-db"]');
    this.info.hidden = true;
  }

  protected async eventListeners() {
    this.event = new Event('mode:change');

    this.mode.onchange = () => this.modeChanged();

    this.print.onclick = (e) => { e.preventDefault(); this.printLogs(); };

    this.clean.onclick = (e) => { e.preventDefault(); this.clearLogs(); };

    this.cacheEmpty.onclick = (e) => { e.preventDefault(); this.clearCache(); };

    this.cachePrint.onclick = (e) => { e.preventDefault(); this.printCache(); };

    this.dataPrint.onclick = (e) => { e.preventDefault(); this.printData(); };

    this.dataEmpty.onclick = (e) => { e.preventDefault(); this.clearData(); };
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
    LoggerService.getAll().then((logs) => {
      console.clear();

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i];

        LoggerService.print(log);
      }
    });
  }

  protected async clearLogs() {
    await LoggerService.clear();
    console.clear();
  }

  protected async clearCache() {
    if (window.confirm('Please confirm the certainty of clearing all cached values.' +
                       '\nThe page will be reloaded.')) {
      await storage.cached.clear();
      document.location.reload();
    }
  }

  protected async printCache() {
    console.log((await storage.cached.dump()));
  }

  protected async printData() {
    const data = await db.dump();
    const transformed = data.reduce((acc: Record<number, Partial<IDBNote>>, { id, ...x }) => {
      acc[id] = {
        ...x,
      };

      return acc;
    }, {});

    console.table(transformed, ['title', 'description', 'order', 'created', 'updated', 'cState', 'pState', 'deleted']);
  }

  protected async clearData() {
    if (window.confirm('Please confirm the certainty of clearing all data.' +
                       '\nAttention! This action is irreversible!' +
                       '\nThe page will be reloaded.')) {
      document.location.reload();
    }
  }

  get enabled(): boolean {
    return this.mode.checked;
  }

  set enabled(value: boolean) {
    this.mode.checked = value;
    this.info.hidden = !value;
  }
}
