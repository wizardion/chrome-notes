import { BaseElement, FormElement } from 'core/components';
import { storage } from 'core/services';
import { LoggerService } from 'modules/logger';
import { IDBNote, db } from 'modules/db';
import { IDBLogNote, IDevSettingsForm } from './models/dev.models';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './template.html'
});

export class DevModeElement extends BaseElement {
  static readonly selector = 'dev-mode-info';
  static observedAttributes = ['disabled', 'default-index'];

  protected event: Event;
  private form: FormElement<IDevSettingsForm>;

  constructor() {
    super();
    this.template = <HTMLElement>template.cloneNode(true);
    this.form = new FormElement<IDevSettingsForm>({
      fieldset: this.template.querySelector('fieldset'),
      mode: this.template.querySelector('input[name="mode"]'),
      info: this.template.querySelector('div[name="dev-info"]'),
      print: this.template.querySelector('a[name="print-logs"]'),
      clean: this.template.querySelector('a[name="clear-logs"]'),
      cachePrint: this.template.querySelector('a[name="print-cache"]'),
      cacheEmpty: this.template.querySelector('a[name="empty-cache"]'),
      dataPrint: this.template.querySelector('a[name="print-db"]'),
      dataEmpty: this.template.querySelector('a[name="empty-db"]'),
    });

    this.form.elements.info.hidden = true;
  }

  protected async eventListeners() {
    this.event = new Event('mode:change');

    this.form.elements.mode.addEventListener('change', () => this.modeChanged());
    this.form.elements.print.addEventListener('click', (e) => { e.preventDefault(); this.printLogs(); });
    this.form.elements.clean.addEventListener('click',  (e) => { e.preventDefault(); this.clearLogs(); });
    this.form.elements.cacheEmpty.addEventListener('click',  (e) => { e.preventDefault(); this.clearCache(); });
    this.form.elements.cachePrint.addEventListener('click',  (e) => { e.preventDefault(); this.printCache(); });
    this.form.elements.dataPrint.addEventListener('click',  (e) => { e.preventDefault(); this.printData(); });
    this.form.elements.dataEmpty.addEventListener('click',  (e) => { e.preventDefault(); this.clearData(); });
  }

  protected attributeChanged(name: string) {
    if (name === 'disabled') {
      if (this.disabled) {
        this.form.elements.fieldset.setAttribute('disabled', 'disabled');
      } else {
        this.form.elements.fieldset.removeAttribute('disabled');
      }
    }
  }

  protected modeChanged() {
    this.form.elements.info.hidden = !this.form.elements.mode.checked;
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
    const global = await storage.global.get();
    const transformed = data.reduce((acc: Record<number, Partial<IDBLogNote>>, { id, ...x }) => {
      acc[id] = {
        ...x,
        cState: x.cState.join(','),
        pState: x.pState
      };

      return acc;
    }, {});

    console.clear();
    console.table(transformed, ['title', 'description', 'order', 'created', 'updated', 'cState', 'pState', 'deleted']);
    console.log('Local data:', global.local);
    console.log('Session data:', global.session);
    console.log('Sync data:', global.sync);
  }

  protected async clearData() {
    if (window.confirm('Please confirm the certainty of clearing all data.' +
                       '\nAttention! This action is irreversible!' +
                       '\nThe page will be reloaded.')) {
      await db.clear();
      await storage.global.clear();
      document.location.reload();
    }
  }

  get enabled(): boolean {
    return this.form.elements.mode.checked;
  }

  set enabled(value: boolean) {
    this.form.elements.mode.checked = value;
    this.form.elements.info.hidden = !value;
  }
}
