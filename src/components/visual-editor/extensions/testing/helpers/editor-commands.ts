import { undo, redo } from 'prosemirror-history';
import { toggleMark } from 'prosemirror-commands';
import { schema } from './schema';


export const CODE_COMMANDS = {
  toggleBold: toggleMark(schema.marks.strong),
  toggleItalic: toggleMark(schema.marks.em),
  toggleStrike: toggleMark(schema.marks.strike),
  toggleUrl: toggleMark(schema.marks.link, { href: 'url-test' }),

  // orderedList: toggleMark(schema.marks.strike),
  // unorderedList: wrapListItem(schema.nodes.bullet_list),

  undo: undo,
  redo: redo,
};
