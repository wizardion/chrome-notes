import { BaseElement, FormElement, IEventListener } from 'core/components';
import { DetailsBaseElement } from 'modules/notes/details-base/details-base.component';
import { MarkdownEditor } from 'components/markdown-editor';
import { IMarkdownViewForm } from './models/markdown-view.model';
import { EditorControlsElement } from '../editor-controls/editor-controls.component';
import { Debounce, DynamicScroll } from 'modules/effects';
import { IDetailsListenerType, INote } from '../details-base/models/details-base.model';
import { NodeHelper } from 'components/node-helper';
import { IEditorData } from 'components/models/editor.models';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './markdown-view.component.html'
});

export class MarkdownViewElement extends DetailsBaseElement<IMarkdownViewForm> {
  static readonly selector = 'details-view';

  protected _preview: boolean;
  protected selection: number[];

  constructor() {
    super();

    this.template = <HTMLElement>template.cloneNode(true);
    this.form = new FormElement<IMarkdownViewForm>({
      head: this.template.querySelector('[name="details-controls"]'),
      back: this.template.querySelector('[name="back"]'),
      delete: this.template.querySelector('[name="delete"]'),
      menu: (this.template.querySelector('[name="controls"]') as EditorControlsElement),
      menuGroup: this.template.querySelector('[name="controls-group"]'),
      description: this.template.querySelector('[name="description"]'),
      preview: this.template.querySelector('[name="preview"]'),
      htmlViewer: this.template.querySelector('[name="html-viewer"]'),
      content: this.template.querySelector('[name="content"]')
    });
  }

  protected render(): void {
    super.render();
    this.editor = new MarkdownEditor(this.form.elements.description, this.form.elements.menu.controls);
  }

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
    this.form.elements.htmlViewer.addEventListener('scroll', debounced, { capture: true, passive: true });
    this.form.elements.preview.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.togglePreview();
    });
  }

  addEventListener(type: IDetailsListenerType, listener: IEventListener, options?: boolean | AddEventListenerOptions) {
    if (type === 'changed') {
      this.listeners.set('selectionEvent', (e) => this.onChange(e));
    }

    return super.addEventListener(type, listener, options);
  }

  getData(): IEditorData {
    const data = super.getData();

    if (this._preview) {
      data.preview = true;
      data.previewSelection = this.getPreviewState();
    }

    return data;
  }

  setData(item: INote) {
    this.editor.setData({ title: item.title, description: item.description });
    this.setSelection(item);
  }

  set hidden(value: boolean) {
    this.dataset.scroll = 'false';
    super.hidden = value;
  }

  set preview(value: boolean) {
    this._preview = value;
    this.editor.hidden = value;
    this.form.elements.htmlViewer.hidden = !value;
    this.form.elements.menuGroup.disabled = value;
    this.form.elements.preview.dataset.checked = (!!value).toString();

    if (value) {
      this.form.elements.htmlViewer.innerHTML = this.editor.render();
      document.addEventListener('selectionchange', this.listeners.get('selectionEvent'));
    } else {
      document.removeEventListener('selectionchange', this.listeners.get('selectionEvent'));
    }
  }

  private togglePreview() {
    const value = !this._preview;

    this.lock();

    if (value) {
      const scrollTop = this.editor.scrollTop;

      this.preview = value;
      this.form.elements.htmlViewer.scrollTop = scrollTop;
    } else {
      const scrollTop = this.form.elements.htmlViewer.scrollTop;

      this.preview = value;
      this.editor.setSelection(this.selection);
      this.editor.scrollTop = scrollTop;
    }

    this.unlock().then(() => this.onChange(new Event('preview')));
  }

  private getPreviewState(): string | null {
    if (this._preview) {
      return NodeHelper.getSelection(this.form.elements.htmlViewer);
    }

    return null;
  }

  private setSelection(item: INote) {
    this.preview = item.preview;
    this.selection = item.cState || [0, 0];
    this.lock();

    if (item.preview) {
      if (item.pState) {
        NodeHelper.setSelection(item.pState, this.form.elements.htmlViewer);
      } else {
        this.form.elements.htmlViewer.scrollTop = 0;
      }

      this.dataset.scroll = (this.form.elements.htmlViewer.scrollTop > 0).toString();
    } else {
      this.editor.setSelection(this.selection);
      this.dataset.scroll = (this.editor.scrollTop > 0).toString();
    }

    this.unlock();
  }
}
