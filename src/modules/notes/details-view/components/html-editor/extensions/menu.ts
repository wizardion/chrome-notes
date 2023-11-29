import { toggleMark } from 'prosemirror-commands';
import { schema } from './schema';
import { insertStar, makeNoteGroup } from './testing/commands';
import { redo, undo } from 'prosemirror-history';
import { Plugin } from 'prosemirror-state';
import { toggleLink } from './commands';
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
  'bold': { command: toggleMark(schema.marks.shouting), dom: null },
  'strikethrough': { command: makeNoteGroup, dom: null },
  'link': { command: toggleLink, dom: null },

  'orderedList': { command: insertStar, dom: null },

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
