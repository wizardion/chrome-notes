import { EditorView, KeyBinding } from '@codemirror/view';
import { defaultKeymap, historyKeymap, indentWithTab, undo, redo } from '@codemirror/commands';
import { markdownKeymap } from '@codemirror/lang-markdown';
import {
  toggleUrl, toggleBold, toggleItalic, toggleStrike, saveChanges, removeFormat, toggleList
} from './editor-commands';


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
  },
  {
    key: 'Mod-s',
    preventDefault: true,
    run: () => saveChanges(),
  },
);

//#region old
// export const markdownRichKeymap: KeyBinding[] = [].concat(
//   defaultKeymap
//   // defaultKeymap.filter(m => ['ArrowLeft', 'ArrowRight'].indexOf(m.key) < 0),
//   // {
//   //   key: 'ArrowLeft',
//   //   preventDefault: true,
//   //   run: (v: EditorView) => stepCursorLeft(v),
//   //   shift: (v: EditorView) => stepSelectionLeft(v),
//   // },
//   // {
//   //   key: 'ArrowRight',
//   //   run: (v: EditorView) => stepCursorRight(v),
//   //   shift: (v: EditorView) => stepSelectionRight(v),
//   //   preventDefault: true
//   // }
// );

// function isHiddenMeta(element: HTMLElement): boolean {
//   const isMeta = element.classList.contains('cm-meta');

//   // if (isMeta && !element.offsetParent) {
//   if (isMeta) {
//     return true;
//   }

//   return false;
// }

// function getStepsLeft(view: EditorView): number {
//   const range = view.state.selection.main;

//   if(range && range.from > 0) {
//     const dom = view.domAtPos(range.from);

//     console.log([dom.node, dom.offset, dom.node.nodeValue]);

//     if (dom.offset === 0) {
//       // return 3;
//       return 1;
//     }

//     if (isHiddenMeta(dom.node.parentElement)) {
//       return 2;
//     }

//     return 1;
//   }

//   return 0;
// }

// function getStepsRight(view: EditorView): number {
//   const range = view.state.selection.main;
//   const dom = view.domAtPos(range.to + 1);

//   if (dom.offset === 0) {
//     return 1;
//   }

//   if (isHiddenMeta(dom.node.parentElement)) {
//     return 2;
//   }

//   return 1;
// }

/**------------------------------------------------ */
// function stepCursorLeft(view: EditorView): boolean {
//   const steps = getStepsLeft(view);

//   if (steps > 1) {
//     cursorSyntaxLeft(view);
//     return stepCursorLeft(view);
//   }

//   return steps === 1? cursorCharLeft(view) : false;
// }

// function stepCursorRight(view: EditorView): boolean {
//   const steps = getStepsRight(view);

//   if (steps > 1) {
//     cursorSyntaxRight(view);
//     return stepCursorRight(view);
//   }

//   return steps === 1? cursorCharRight(view) : false;
// }

// function stepSelectionLeft(view: EditorView): boolean {
//   const steps = getStepsLeft(view);

//   if (steps > 1) {
//     selectSyntaxLeft(view);
//     return stepSelectionLeft(view);
//   }

//   return steps === 1? selectCharLeft(view) : false;
// }

// function stepSelectionRight(view: EditorView): boolean {
//   const steps = getStepsRight(view);

//   if (steps > 1) {
//     selectSyntaxRight(view);
//     return stepSelectionRight(view);
//   }

//   return steps === 1? selectCharRight(view) : false;
// }
//#endregion
