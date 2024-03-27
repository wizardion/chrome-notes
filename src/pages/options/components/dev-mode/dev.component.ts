import { BaseElement, FormElement } from 'core/components';
import { storage } from 'core/services';
import { LoggerService } from 'modules/logger';
import { IDBNote, db } from 'modules/db';
import { Cloud } from 'modules/sync/cloud';
import { IDBLogNote, IDBParsedData, IDevSettingsForm } from './models/dev.models';


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
      dataRestore: this.template.querySelector('a[name="restore-db"]'),
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
    this.form.elements.dataRestore.addEventListener('click',  (e) => { e.preventDefault(); this.restoreData(); });
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

    console.clear();

    if (data?.length) {
      const table = data.reduce((acc: Record<number, Partial<IDBLogNote>>, { id, ...x }) => {
        acc[id] = {
          ...x,
          cState: x.cState.join(','),
          pState: x.pState
        };

        return acc;
      }, {});

      console.table(table, ['title', 'description', 'order', 'created', 'updated', 'cState', 'pState', 'deleted']);
    }

    console.log('Local data:', global.local);
    console.log('Session data:', global.session);
    console.log('Sync data:', global.sync);
    console.log('Data in JSON:', data || 'None');
  }

  protected async restoreData() {
    const value = window.prompt('Please enter all data in JSON format.' +
                               '\nAttention! All saved data will be lost, this action is irreversible!' +
                               '\nThe page will be reloaded.');

    if (value) {
      try {
        const data = this.parseData(value);

        if (this.validateData(data)) {
          await this.clearData(true);

          for (let i = 0; i < data.valid.length; i++) {
            const item = data.valid[i];

            await db.add(item);
          }

          if (data.invalid.length) {
            console.log('Invalid items', data.invalid);
          }

          window.alert(`Has been restored ${data.valid.length} notes.` +
                       `\nAnd ${data.invalid.length} items have invalid DATA format.`);
          document.location.reload();
        }
      } catch (er) {
        window.alert('You entered incorrect DATA or not in JSON format!');
      }
    }
  }

  protected async clearData(force?: boolean) {
    if (force || window.confirm(
      'Please confirm the certainty of clearing all data.\nAttention! This action is irreversible!' +
      '\nThe page will be reloaded.'
    )) {
      await LoggerService.clear();
      await Cloud.remove();
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

  private parseData(value: string): IDBParsedData {
    const data = JSON.parse(value);
    const notes: IDBNote[] = [];
    const invalid = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i] as IDBNote;

      if (typeof (item.id) === 'number' && !Number.isNaN(item.id) && Number.isInteger(item.id)
        && typeof (item.title) === 'string' && typeof (item.description) === 'string'
        && typeof (item.order) === 'number' && !Number.isNaN(item.order) && Number.isInteger(item.order)
        && typeof (item.updated) === 'number' && !Number.isNaN(item.updated) && Number.isInteger(item.updated)
        && typeof (item.created) === 'number' && !Number.isNaN(item.created) && Number.isInteger(item.created)
        && typeof (item.deleted) === 'number' && (item.deleted === 0 || item.deleted === 1)) {
        const note: IDBNote = {
          id: item.id,
          title: item.title,
          description: item.description,
          order: item.order,
          updated: item.updated,
          created: item.created,
          deleted: item.deleted,
          synced: typeof (item.synced) === 'number' ? item.synced : 0,
          preview: typeof (item.preview) === 'boolean' ? item.preview : false,
          cState: [0, 0],
          pState: null
        };

        if (typeof (item.locked) === 'boolean') {
          note.locked = item.locked;
        }

        notes.push(note);
      } else {
        invalid.push(item);
      }
    }

    return { valid: notes, invalid: invalid };
  }

  private validateData(data: IDBParsedData): boolean {
    if (data.valid.length > 0 && data.invalid.length > 0
      && window.confirm(`Data entered contains ${data.invalid.length} invalid items ` +
        `and ${data.valid.length} valid notes.` +
        `\nOnly valid records will be restored. Would you like to continue?`)) {
      return true;
    }

    return data.invalid.length === 0;
  }
}
