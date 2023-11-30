import { toggleMark } from 'prosemirror-commands';
import { schema } from './schema';
import { redo, undo } from 'prosemirror-history';
import { Plugin } from 'prosemirror-state';
import { removeFormat, toMarkdown, toggleLink, toggleList } from './commands';
import { MenuView } from './helpers/menu.view';
import { IMenuItem } from './helpers/models/menu.models';


/*
'bold': toggleBold,
'strikethrough': toggleStrike,
'italic': toggleItalic,
'orderedList': (v) => toggleList(v, '1. '),
'unorderedList': (v) => toggleList(v, '- '),
'removeFormat': removeFormat,
'link': toggleUrl,
'undo': undo,
'redo': redo,
*/
export const CODE_ACTIONS: Record<string, IMenuItem> = {
  'bold': { command: toggleMark(schema.marks.strong), dom: null },
  'italic': { command: toggleMark(schema.marks.italic), dom: null },
  'strikethrough': { command: toggleMark(schema.marks.strike), dom: null },
  'link': { command: toggleLink, dom: null },

  'orderedList': { command: toggleList, dom: null },
  'unorderedList': { command: toMarkdown, dom: null },

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
    // key: 'menu',
    view(editorView) {
      return new MenuView(items, editorView);
    }
  });
}
