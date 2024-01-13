import './assets/details-view.scss';
import { BaseElement, FormElement } from 'core/components';
import { IDetailsIntervals, IDetailsViewForm, IEventListenerType } from './details-view.model';
import { NodeHelper } from './components/node-helper';
import { IDBNote, IPReviewState } from 'modules/db';
import { IEditorView, IEditorData } from 'components/models/editor.models';
import { EditorControlsElement } from '../editor-controls/editor-controls.component';
import { Debounce } from 'modules/effects';


const INTERVALS: IDetailsIntervals = { changed: null, locked: null, delay: 800 };
const template: DocumentFragment = BaseElement.component({
  templateUrl: './details-view.component.html'
});

export class DetailsViewElement extends BaseElement {
  static readonly selector: string;

  protected form: FormElement<IDetailsViewForm>;
  protected editor: IEditorView;
  protected _draft: boolean;
  private _preview: boolean;
  private _locked: boolean;

  constructor() {
    super();

    this.template = <HTMLElement>template.cloneNode(true);
    this.form = new FormElement<IDetailsViewForm>({
      content: this.template.querySelector('[name="details-view"]'),
      head: this.template.querySelector('[name="details-controls"]'),
      back: this.template.querySelector('[name="back"]'),
      cancel: this.template.querySelector('[name="cancel"]'),
      create: this.template.querySelector('[name="create"]'),
      delete: this.template.querySelector('[name="delete"]'),
      menu: (this.template.querySelector('[name="controls"]') as EditorControlsElement),
      menuGroup: this.template.querySelector('[name="controls-group"]'),
      description: this.template.querySelector('[name="description"]'),
      preview: this.template.querySelector('[name="preview"]'),
      previewer: this.template.querySelector('[name="previewer"]'),
    });
  }

  protected eventListeners(): void {
    const storeScroll = (e: Event) => {
      this.form.elements.content.dataset.scroll = ((e.target as HTMLElement).scrollTop > 0).toString();
    };

    this.editor.element.addEventListener('scroll', Debounce.debounce(storeScroll), { passive: true });
  }

  get data(): IEditorData {
    return this.editor.getData();
  }

  get value(): string {
    return this.editor.value;
  }

  set value(description: string) {
    this.editor.value = description;
  }

  get draft(): boolean {
    return this._draft;
  }

  set draft(value: boolean) {
    this._draft = value;

    this.form.elements.delete.hidden = value;
    this.form.elements.preview.hidden = value;
    this.form.elements.create.hidden = !value;
    this.form.elements.cancel.hidden = !value;
    this.form.elements.back.hidden = value;
  }

  set preview(value: boolean) {
    this.form.elements.previewer.hidden = !value;
    this.form.elements.preview.dataset.checked = value.toString();
    this._preview = value;

    this.form.elements.menuGroup.disabled = value;

    if (value) {
      this.form.elements.previewer.innerHTML = this.editor.render();
    }
  }

  togglePreview(): boolean {
    const value = !this._preview;

    this._locked = true;

    if (value) {
      const scrollTop = this.editor.scrollTop;

      this.preview = value;
      this.form.elements.previewer.scrollTop = scrollTop;
    } else {
      const scrollTop = this.form.elements.previewer.scrollTop;

      this.preview = value;
      this.editor.focus();
      this.editor.scrollTop = scrollTop;
    }

    clearInterval(INTERVALS.locked);
    INTERVALS.locked = setTimeout(() => this._locked = false, INTERVALS.delay);

    return value;
  }

  getPreviewState(): IPReviewState | null {
    if (this._preview) {
      return {
        scrollTop: this.form.elements.previewer.scrollTop,
        selection: NodeHelper.getSelection(this.form.elements.previewer)
      };
    }

    return null;
  }

  setData(value: IEditorData) {
    this.editor.setData(value);
  }

  setPreviewData(preview: boolean, state: IPReviewState | null) {
    this._locked = true;
    this.preview = preview;

    if (state && preview) {
      setTimeout(() => {
        NodeHelper.setSelection(state.selection, this.form.elements.previewer);
        this.form.elements.previewer.scrollTop = state.scrollTop;
      }, 15);
    }

    clearInterval(INTERVALS.locked);
    INTERVALS.locked = setTimeout(() => this._locked = false, INTERVALS.delay);
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

  onSelectionPreviewChange(listener: EventListener, checkElement = true) {
    if (!this._locked && (!checkElement || document.activeElement === this.form.elements.previewer)) {
      clearInterval(INTERVALS.changed);
      INTERVALS.changed = setTimeout(() => listener(new Event('selectionchange')), INTERVALS.delay);
    }
  }

  onCreateEventChange(e: Event, listener: EventListener) {
    if (this._draft) {
      e.preventDefault();

      return listener(e);
    }
  }

  addEventListener(type: IEventListenerType, listener: EventListener, options?: boolean | AddEventListenerOptions) {
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

    if (type === 'preview') {
      this.form.elements.preview.addEventListener('mousedown', (e) => {
        e.preventDefault();
        listener(e);
      });

      // return this.form.elements.preview.addEventListener('mousedown', listener);
      return;
    }

    if (type === 'change') {
      return this.editor.addEventListener('change', listener);
    }

    if (type === 'selectionchange') {
      this.form.elements.previewer.addEventListener('scroll', () => this.onSelectionPreviewChange(listener, false));

      return document.addEventListener('selectionchange', () => this.onSelectionPreviewChange(listener));
    }

    return super.addEventListener(type, listener, options);
  }
}
