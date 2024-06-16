import { EditorView } from 'prosemirror-view';
import { IMenuItem } from './models/menu.models';


export class MenuView {
  view: EditorView;
  items: IMenuItem[];

  constructor(items: IMenuItem[], view: EditorView) {
    this.items = items;
    this.view = view;

    items.forEach(item => {
      item.event = (e: MouseEvent | KeyboardEvent) => {
        e.preventDefault();

        this.view.focus();
        item.command(this.view.state, this.view.dispatch, this.view);
      };

      item.dom.addEventListener('mousedown', item.event);
    });

    setTimeout(() => this.update(), 10);
  }

  update() {
    this.items.forEach(({ command, dom }) => {
      const active = command(this.view.state, null, this.view);

      dom.disabled = !active;
    });
  }

  destroy() {
    this.items.forEach(item => item.dom.removeEventListener('mousedown', item.event));
  }
}
