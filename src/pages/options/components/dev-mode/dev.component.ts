import { BaseElement, FormElement } from 'core/components';
import { storage } from 'core/services';
import { LoggerService } from 'modules/logger';
import { IDBNote, db } from 'modules/db';
import { Cloud } from 'modules/sync/cloud';
import { IDBLogNote, IDBParsedData, IDevSettingsForm } from './models/dev.models';
import { resetDefaults } from 'modules/settings';
import { delay, getApplicationId } from 'core/index';


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
      workersPrint: this.template.querySelector('a[name="print-workers"]'),
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
    this.form.elements.workersPrint.addEventListener('click',  (e) => { e.preventDefault(); this.printWorkers(); });
    this.form.elements.dataPrint.addEventListener('click',  (e) => { e.preventDefault(); this.printData(); });
    this.form.elements.dataRestore.addEventListener('click',  (e) => { e.preventDefault(); this.restoreData(); });
    this.form.elements.dataEmpty.addEventListener('click',  (e) => { e.preventDefault(); this.eraseAllData(); });
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

  protected async printWorkers() {
    const workers = await chrome.alarms.getAll();
    const list: Record<string, {periodInMinutes: number, scheduledTime: string}> = {};

    console.clear();

    for (const worker of workers) {
      const date = new Date(worker.scheduledTime);

      list[worker.name] = {
        periodInMinutes: worker.periodInMinutes,
        scheduledTime: date.toLocaleString()
      };
    }

    console.table(list);
  }

  protected async printData() {
    const data = await db.dump();
    const global = await storage.global.get();

    console.clear();

    if (data?.length) {
      const table = data.reduce((acc: Record<number, Partial<IDBLogNote>>, { id, ...x }) => {
        acc[id] = {
          ...x,
          cState: x.cState?.join(','),
          pState: x.pState
        };

        return acc;
      }, {});

      console.table(table, [
        'title', 'description', 'order', 'created', 'updated', 'preview', 'pState', 'pState', 'deleted', 'synced',
        'locked'
      ]);
      console.log('Data in JSON:', data || 'None');
      console.log('');
    }

    console.log('Local data:', global.local);
    console.log('Session data:', global.session);
    console.log('Sync data:', global.sync);
  }

  protected async restoreData() {
    const value = window.prompt('Please enter all data in JSON format.' +
                               '\nAttention! All saved data will be lost, this action is irreversible!' +
                               '\nThe page will be reloaded.');

    if (value) {
      document.write(
        '<div style="margin: 20px auto; text-align: center; font-size: larger;">... Processing data ...</div>'
      );

      try {
        const data = this.parseData(JSON.parse(value));

        await delay(500);

        if (this.validateData(data)) {
          const items = this.representNotes(data.valid);

          await this.clearData();
          await delay(2000);

          for (let i = 0; i < items.length; i++) {
            const item = items[i];

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

  protected async clearData() {
    try {
      await Cloud.remove();
      await db.clear();
      await storage.global.clear();
      await LoggerService.clear();
      await resetDefaults();
      await chrome.runtime.sendMessage({ data: 'removed', id: await getApplicationId() });
    } catch (error) {
      window.alert('Oops! Something is wrong!\n' + error.message + '\n\nPlease see logs for more details.');
      console.log(error);
    }
  }

  protected async eraseAllData() {
    if (window.confirm(
      'Please confirm the certainty of clearing all data.\nAttention! This action is irreversible!' +
      '\nThe page will be reloaded.'
    )) {
      document.write(
        '<div style="margin: 20px auto; text-align: center; font-size: larger;">... Erasing data ...</div>'
      );

      await this.clearData();
      await delay(2000);

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

  private parseData(data: object[]): IDBParsedData {
    const valid: Partial<IDBNote>[] = [];
    const invalid = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i] as Partial<IDBNote>;

      if (typeof (item.id) === 'number' && !Number.isNaN(item.id) && Number.isInteger(item.id)
        && typeof (item.title) === 'string' && typeof (item.description) === 'string'
        && typeof (item.order) === 'number' && !Number.isNaN(item.order) && Number.isInteger(item.order)
        && typeof (item.updated) === 'number' && !Number.isNaN(item.updated) && Number.isInteger(item.updated)
        && typeof (item.created) === 'number' && !Number.isNaN(item.created) && Number.isInteger(item.created)
        && typeof (item.deleted) === 'number' && item.deleted === 0) {
        valid.push(item);
      } else {
        invalid.push(item);
      }
    }

    return { valid: valid.sort((a, b) => a.order - b.order), invalid: invalid };
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

  private representNotes(data: Partial<IDBNote>[]): IDBNote[] {
    const notes: IDBNote[] = [];

    for (let i = 0; i < data.length; i++) {
      const item = data[i];

      const note: IDBNote = {
        id: item.id,
        title: item.title,
        description: item.description,
        order: i,
        updated: item.updated,
        created: item.created,
        deleted: item.deleted,
        synced: 0,
        preview: typeof (item.preview) === 'boolean' ? item.preview : false,
        cState: [0, 0],
        pState: null
      };

      if (typeof (item.locked) === 'boolean') {
        note.locked = item.locked;
      }

      notes.push(note);
    }

    return notes;
  }
}
