import './assets/details-view.scss';
import { BaseElement, FormElement } from 'core/components';
import { IDetailsViewForm, IDetailsListenerType, INote } from './details-base.model';
import { IDBNote } from 'modules/db';
import { IEditorView } from 'components/models/editor.models';
import { Debounce, DynamicScroll } from 'modules/effects';


export abstract class DetailsBaseElement<T extends IDetailsViewForm = IDetailsViewForm> extends BaseElement {
  static readonly selector: string;

  protected editor: IEditorView;
  protected _draft: boolean;

  protected form: FormElement<T>;
  protected note?: INote;
  protected _locked: boolean;

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

  get draft(): boolean {
    return this._draft;
  }

  set draft(value: boolean) {
    this._draft = value;

    this.form.elements.delete.hidden = value;
    this.form.elements.create.hidden = !value;
    this.form.elements.cancel.hidden = !value;
    this.form.elements.back.hidden = value;
  }

  set hidden(value: boolean) {
    this.dataset.scroll = 'false';
    super.hidden = value;
  }

  get elements(): T {
    return this.form.elements;
  }

  getData(): INote {
    const data = this.editor.getData();

    this.note.title = data.title;
    this.note.description = data.description;
    this.note.cState = data.selection;

    return this.note;
  }

  setData(item: INote) {
    this.note = item;
    this.editor.setData({ title: item.title, description: item.description, selection: item.cState });
    this.dataset.scroll = (this.editor.scrollTop > 0).toString();
  }

  focus() {
    this.editor.focus();
  }

  default(): IDBNote {
    const { title, description, selection } = this.editor.getData();
    const time = new Date().getTime();

    return {
      id: 0,
      title: title,
      description: description,
      order: 0,
      cState: selection,
      updated: time,
      created: time,
      deleted: 0
    };
  }

  onCreateEventChange(e: Event, listener: EventListener) {
    if (this._draft) {
      e.preventDefault();

      return listener(e);
    }
  }

  addEventListener(type: IDetailsListenerType, listener: EventListener, options?: boolean | AddEventListenerOptions) {
    if (type === 'back') {
      this.form.elements.back.addEventListener('mousedown', (e) => e.preventDefault());

      return this.form.elements.back.addEventListener('click', listener);
    }

    if (type === 'cancel') {
      this.form.elements.cancel.addEventListener('mousedown', (e) => e.preventDefault());

      return this.form.elements.cancel.addEventListener('click', listener);
    }

    if (type === 'delete') {
      this.form.elements.delete.addEventListener('mousedown', (e) => e.preventDefault());

      return this.form.elements.delete.addEventListener('click', listener);
    }

    if (type === 'create') {
      this.form.elements.create.addEventListener('mousedown', (e) => e.preventDefault());
      this.form.elements.create.addEventListener('click', (e) => this.onCreateEventChange(e, listener));

      return this.editor.addEventListener('save', (e) => this.onCreateEventChange(e, listener));
    }

    if (type === 'change') {
      return this.editor.addEventListener('change', listener);
    }

    return super.addEventListener(type, listener, options);
  }
}
