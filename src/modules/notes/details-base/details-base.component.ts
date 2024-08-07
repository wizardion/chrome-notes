import './assets/details-view.scss';

import { IDBNote } from 'modules/db';
import { applicationConfigs } from 'core';
import { BaseElement, FormElement, IEventIntervals, IEventListener } from 'core/components';
import { IDetailsViewForm, IDetailsListenerType, INote } from './models/details-base.model';
import { IEditorData, IEditorView } from 'components/models/editor.models';
import { Debounce, DynamicScroll } from 'modules/effects';


const INTERVALS: IEventIntervals = { delay: applicationConfigs.delayedInterval, intervals: { locked: null } };

export abstract class DetailsBaseElement<T extends IDetailsViewForm = IDetailsViewForm> extends BaseElement {
  static readonly selector: string;

  protected editor: IEditorView;
  protected form: FormElement<T>;
  protected listeners = new Map<'change' | 'selectionEvent' | 'save' | 'create', IEventListener>();

  private _locked: boolean;

  protected eventListeners(): void {
    let dataScroll = false;
    const watcher = DynamicScroll.watch(this.editor.element);
    const debounced = Debounce.debounce((e: Event) => {
      const scrolled = (e.target as HTMLElement).scrollTop > 0;

      if (dataScroll !== scrolled) {
        dataScroll = scrolled;
        this.dataset.scroll = dataScroll.toString();
      }

      watcher.toggle();
    });

    this.editor.element.addEventListener('scroll', debounced, { capture: true, passive: true });
  }

  protected onChange(e: Event) {
    const handler = this.listeners.get('change');

    if (!this._locked && handler) {
      handler(e);
    }
  }

  protected onSave(e: Event) {
    if (!this._locked) {
      const handler = this.listeners.get('change');

      if (handler) {
        this.lock();
        handler(e);
        this.unlock();
      }
    }
  }

  set hidden(value: boolean) {
    this.dataset.scroll = 'false';
    super.hidden = value;
  }

  get elements(): T {
    return this.form.elements;
  }

  get locked(): boolean {
    return this._locked;
  }

  lock() {
    this._locked = true;
  }

  unlock(): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      clearInterval(INTERVALS.intervals.locked);
      INTERVALS.intervals.locked = setTimeout(() => {
        this._locked = false;

        resolve(this._locked);
      }, INTERVALS.delay);
    });
  }

  getData(): IEditorData {
    return this.editor.getData();
  }

  setData(item: INote) {
    this.lock();
    this.editor.setData({ title: item.title, description: item.description, selection: item.cState });
    this.dataset.scroll = (this.editor.scrollTop > 0).toString();
    this.unlock();
  }

  getSelection(): number[] {
    return this.editor.getSelection();
  }

  getPreviewState(): string | null {
    return null;
  }

  focus() {
    this.editor.focus();
  }

  default(): IDBNote {
    const time = new Date().getTime();

    return {
      id: 0,
      title: '',
      description: '',
      order: 0,
      cState: [0, 0],
      updated: time,
      created: time,
      deleted: 0
    };
  }

  addEventListener(type: IDetailsListenerType, listener: IEventListener, options?: boolean | AddEventListenerOptions) {
    if (type === 'cancel') {
      this.form.elements.back.addEventListener('mousedown', (e) => e.preventDefault());

      return this.form.elements.back.addEventListener('click', listener);
    }

    if (type === 'delete') {
      this.form.elements.delete.addEventListener('mousedown', (e) => e.preventDefault());

      return this.form.elements.delete.addEventListener('click', listener);
    }

    if (type === 'changed') {
      this.listeners.set('change', listener);
      this.editor.addEventListener('change', (e) => this.onChange(e));

      return this.editor.addEventListener('save', (e) => this.onSave(e));
    }

    return super.addEventListener(type, listener, options);
  }
}
