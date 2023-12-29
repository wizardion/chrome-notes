import { toggleMark } from 'prosemirror-commands';
import { schema } from './schema';
import { redo, undo } from 'prosemirror-history';
import { Plugin } from 'prosemirror-state';
import { removeFormat, toggleLink, toggleList } from './commands';
import { MenuView } from './helpers/menu.view';
import { IMenuItem } from './helpers/models/menu.models';


export const CODE_ACTIONS: Record<string, IMenuItem> = {
  'bold': { command: toggleMark(schema.marks.strong), dom: null },
  'italic': { command: toggleMark(schema.marks.italic), dom: null },
  'strikethrough': { command: toggleMark(schema.marks.strike), dom: null },
  'link': { command: toggleLink, dom: null },

  'orderedList': { command: toggleList(schema.nodes.orderedList), dom: null },
  'unorderedList': { command: toggleList(schema.nodes.bulletList), dom: null },
  'removeFormat': { command: removeFormat, dom: null },

  'undo': { command: undo, dom: null },
  'redo': { command: redo, dom: null },
};

export function menu(controls: NodeList): Plugin {
  const items: IMenuItem[] = [];

  controls.forEach((el: HTMLInputElement) => {
    const item = CODE_ACTIONS[el.getAttribute('action')];

    if (item) {
      item.dom = el;
      items.push(item);
    }
  });

  return new Plugin({
    view(editorView) {
      return new MenuView(items, editorView);
    }
  });
}
