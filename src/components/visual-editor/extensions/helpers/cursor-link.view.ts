import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { IRect } from './models/cursor.models';
import { BaseElement } from 'core/components';
import { ILinkForm, ITooltipEvents } from './models/link.models';
import { UrlHelper } from './url.helper';


export const widget = document.createElement('div');


const template = BaseElement.component({
  templateUrl: './cursor-link.view.html'
});

export class CursorLinkView {
  public static widget = widget;

  private form: ILinkForm;
  private events: ITooltipEvents;
  private view?: EditorView;

  constructor(view: EditorView) {
    const tmp = <HTMLElement>template.cloneNode(true);

    this.form = {
      tooltip: tmp.querySelector('[name="tooltip"]'),
      container: tmp.querySelector('[name="container"]'),
      controls: tmp.querySelector('[name="controls"]'),
      edit: tmp.querySelector('[name="edit"]'),
      remove: tmp.querySelector('[name="remove"]'),
    };

    this.events = {
      edit: (e) => {
        e.preventDefault();
        this.edit();
      },
      remove: (e) => {
        e.preventDefault();
        this.remove();
      },
    };

    this.form.edit.addEventListener('mousedown', this.events.edit);
    this.form.remove.addEventListener('mousedown', this.events.remove);

    widget.appendChild(this.form.tooltip);
    this.update(view, null);
  }

  update(view: EditorView, previous: EditorState) {
    const state = view.state;
    const selection = state.selection;

    // Don't do anything if the document/selection didn't change
    if (previous && previous.doc.eq(state.doc) && previous.selection.eq(selection)) {
      return;
    }

    const mark = selection.empty && selection.$from.marks().find(i => i.type.name === 'link');

    if (mark) { // if (!this.mark || !mark.eq(this.mark)) {
      const { from, $from } = state.selection;
      const boundaries = this.copyRect(view.dom.getBoundingClientRect());
      const cursor = this.normalize(view.coordsAtPos(from - ($from.nodeBefore?.text.length || 0)), boundaries);
      const url = mark.attrs['href'] as string;

      this.form.tooltip.hidden = false;
      this.form.container.innerHTML = `<a href="${url}" target="_blank">${url}</a>`;
      this.form.tooltip.className = 'link-tooltip';

      this.form.tooltip.style.top =  `${cursor.bottom + 2}px`;
      this.form.tooltip.style.left = `clamp(0px, ${cursor.left}px, calc(100% - ${this.form.tooltip.offsetWidth}px))`;

      if (cursor.bottom + 2 + this.form.tooltip.offsetHeight > boundaries.bottom - boundaries.top) {
        this.form.tooltip.style.top =  `${cursor.top - 2 - this.form.tooltip.offsetHeight}px`;
      }

      this.form.tooltip.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      this.view = view;

      return;
    }

    this.form.tooltip.hidden = true;
  }

  edit() {
    const state = this.view.state;
    const [anchor, head] = UrlHelper.linkAround(state, state.selection.from);
    const transaction = UrlHelper.removeLink(state, anchor, head);

    if (transaction) {
      this.view.dispatch(transaction);
    }
  }

  remove() {
    const state = this.view.state;
    const [anchor, head] = UrlHelper.linkAround(state, state.selection.from);
    const transaction = UrlHelper.removeMark(state, anchor, head);

    if (transaction) {
      this.view.dispatch(transaction);
    }
  }

  destroy() {
    this.view = null;
    this.form.edit.removeEventListener('mousedown', this.events.edit);
    this.form.remove.removeEventListener('mousedown', this.events.remove);

    this.form.edit.remove();
    this.form.remove.remove();
    this.form.controls.remove();
    this.form.container.remove();
    this.form.tooltip.remove();
  }

  private copyRect(rect: IRect) :IRect {
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom
    };
  }

  private normalize(rect: DOMRect | IRect, root: DOMRect | IRect): IRect {
    return {
      left: rect.left - root.left,
      top: rect.top - root.top,
      right: rect.right - root.left,
      bottom: rect.bottom - root.top,
    };
  }
}
