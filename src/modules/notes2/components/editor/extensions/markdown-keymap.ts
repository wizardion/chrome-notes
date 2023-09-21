import {EditorView, KeyBinding} from '@codemirror/view';
import { defaultKeymap, historyKeymap, indentWithTab } from '@codemirror/commands';
import {markdownKeymap} from '@codemirror/lang-markdown';


export {undo, redo} from '@codemirror/commands';

export const editorKeymap: KeyBinding[] = [].concat( 
  [].concat(
    defaultKeymap, 
    indentWithTab, 
    historyKeymap, 
    markdownKeymap
  ).filter(m => ['Mod-b', 'Mod-i', 'Mod-u', 'Mod-l'].indexOf(m.key) < 0),
  { 
    key: 'Mod-b', 
    preventDefault: true, 
    run: (v: EditorView) => markBold(v),
  },
  { 
    key: 'Mod-i',
    preventDefault: true, 
    run: (v: EditorView) => markItalic(v),
  },
  { 
    key: 'Mod-u',
    preventDefault: true, 
    run: (v: EditorView) => markStrike(v),
  },
  { 
    key: 'Mod-l',
    preventDefault: true, 
    run: (v: EditorView) => insertLink(v),
  },
);

export function regexCommand(view: EditorView, text: string, template: string) {
  const range = view.state.selection.main;

  const regex = new RegExp(template.replace(/\$\{text\}/gi, '(.+)').replace(/([^().+])/gi, '\\$1'), 'gi');
  const value = text.match(regex) ? text.replace(regex, '$1') : template.replace(/\$\{text\}/gi, text);

  view.dispatch(view.state.replaceSelection(value));
  view.dispatch({selection: {anchor: range.from, head: range.from + value.length}});
}

export function markBold(view: EditorView) {
  const range = view.state.selection.main;
  const text = view.state.sliceDoc(range.from, range.to);

  if (text) {
    regexCommand(view, text, '**${text}**');
  }
}

export function markItalic(view: EditorView) {
  const range = view.state.selection.main;
  const text = view.state.sliceDoc(range.from, range.to);

  if (text) {
    regexCommand(view, text, '*${text}*');
  }
}

export function markStrike(view: EditorView) {
  const range = view.state.selection.main;
  const text = view.state.sliceDoc(range.from, range.to);

  if (text) {
    regexCommand(view, text, '~~${text}~~');
  }
}

export function insertLink(view: EditorView) {
  const range = view.state.selection.main;
  const text = view.state.sliceDoc(range.from, range.to);

  if (text) {
    const rule = /\s*\[(.+)\].*/gi;
    const template = '[${text}](url)';

    if (!text.match(rule)) {
      const value = template.replace(/\$\{text\}/gim, text);

      view.dispatch(view.state.replaceSelection(value));
      view.dispatch({selection: {anchor: range.from + text.length + 3, head: range.from + value.length - 1}});
    } else {
      const value = text.replace(rule, '$1');

      view.dispatch(view.state.replaceSelection(value));
      view.dispatch({selection: {anchor: range.from, head: range.from + value.length}});
    }
  }
}

export function insertList(view: EditorView) {
  // const range = view.state.selection.main;
  // const text = view.state.sliceDoc(range.from, range.to);

  // if (!text.match(/^1.\s|^-\s/gi)) {
  //   // const cursor: CodeMirror.Position = this.codemirror.getCursor();

  //   // if ((cursor.ch > 0 ? text.length - cursor.ch : cursor.ch) !== 0) {
  //   //   this.codemirror.replaceSelection('\n');
  //   // }

  //   // this.codemirror.replaceSelection(text.replace(/^|(\n)/gi, `$1${prefix}`), 'around');
  // } else {
  //   const value = text.replace(/^1.\s|^-\s/gim, '');

  //   view.dispatch(view.state.replaceSelection(value));
  //   // view.dispatch({selection: {anchor: range.from, head: range.from + value.length}});
  //   // this.codemirror.replaceSelection(text.replace(/^1.\s|^-\s/gim, ''), 'around');
  // }
}

export function removeFormat(view: EditorView) {
  const range = view.state.selection.main;
  const text = view.state.sliceDoc(range.from, range.to);

  if (text) {
    
    // view.dispatch(view.state.replaceSelection(value));
    // view.dispatch({selection: {anchor: range.from, head: range.from + value.length}});
  }
  // const html = this.md.render(text).replace(/(th|td)>\n<(th|td)/gi, '$1\> \<$2');
  // const dirt = this.md.unescapeAll(html.replace(/(<([^>]+)>)/gi, ''));
  // const plain = dirt.replace(/^[\s\n\r]+|[\s\n\r]+$|(\n)[\s\n\r]+/gi, '$1');

  // this.codemirror.replaceSelection(plain, 'around');
}

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

// // -----------------------------------------------------------------------------------------------------------------------
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
  