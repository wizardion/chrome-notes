import { EditorView, KeyBinding } from '@codemirror/view';
import { defaultKeymap, historyKeymap, indentWithTab, undo, redo } from '@codemirror/commands';
import { markdownKeymap } from '@codemirror/lang-markdown';
import { toggleUrl, toggleBold, toggleItalic, toggleStrike, removeFormat, toggleList, toggleHeading } from './commands';


export const CODE_ACTIONS: Record<string, (view: EditorView) => void> = {
  'bold': toggleBold,
  'strikethrough': toggleStrike,
  'italic': toggleItalic,
  'orderedList': (v) => toggleList(v, '1. '),
  'unorderedList': (v) => toggleList(v, '- '),
  'removeFormat': removeFormat,
  'link': toggleUrl,
  'undo': undo,
  'redo': redo,

  'paragraph': (v) => toggleHeading(v, ''),
  'heading-1': (v) => toggleHeading(v, '# '),
  'heading-2': (v) => toggleHeading(v, '## '),
  'heading-3': (v) => toggleHeading(v, '### '),
  'heading-4': (v) => toggleHeading(v, '#### '),
  'heading-5': (v) => toggleHeading(v, '##### '),
};

export const editorKeymap: KeyBinding[] = [].concat(
  [].concat(
    defaultKeymap,
    indentWithTab,
    historyKeymap,
    markdownKeymap
  ).filter(m => ['Mod-b', 'Mod-i', 'Mod-u', 'Mod-l', 'Mod-s'].indexOf(m.key) < 0),
  {
    key: 'Mod-b',
    preventDefault: true,
    run: (v: EditorView) => toggleBold(v),
  },
  {
    key: 'Mod-i',
    preventDefault: true,
    run: (v: EditorView) => toggleItalic(v),
  },
  {
    key: 'Mod-u',
    preventDefault: true,
    run: (v: EditorView) => toggleStrike(v),
  },
  {
    key: 'Mod-l',
    preventDefault: true,
    run: (v: EditorView) => toggleUrl(v),
  }
);
