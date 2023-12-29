import { Command } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { CODE_COMMANDS } from './editor-commands';


// export const CODE_ACTIONS: Record<string, (view: EditorView) => void> = {
//   'bold': toggleBold,
//   'strikethrough': toggleStrike,
//   'italic': toggleItalic,
//   'orderedList': (v) => toggleList(v, '1. '),
//   'unorderedList': (v) => toggleList(v, '- '),
//   'removeFormat': removeFormat,
//   'link': toggleUrl,
//   'undo': undo,
//   'redo': redo,
// };

export const CODE_ACTIONS: Record<string, (view: EditorView) => void> = {
  'bold': (v) => CODE_COMMANDS.toggleBold(v.state, v.dispatch),
  'italic': (v) => CODE_COMMANDS.toggleItalic(v.state, v.dispatch),
  'strikethrough': (v) => CODE_COMMANDS.toggleStrike(v.state, v.dispatch),
  'link': (v) => CODE_COMMANDS.toggleUrl(v.state, v.dispatch),

  // 'unorderedList': (v) => CODE_COMMANDS.unorderedList(v.state, v.dispatch),

  // 'orderedList': (v) => {
  //   console.log('orderedList...');
  //   CODE_COMMANDS.orderedList(v.state, v.dispatch);
  // },

  'undo': (v) => CODE_COMMANDS.undo(v.state, v.dispatch),
  'redo': (v) => CODE_COMMANDS.redo(v.state, v.dispatch),
};

export const editKeymap: Record<string, Command> = {
  'Mod-z': CODE_COMMANDS.undo,
  'Shift-Mod-z': CODE_COMMANDS.redo,
  'Mod-b': CODE_COMMANDS.toggleBold
};

