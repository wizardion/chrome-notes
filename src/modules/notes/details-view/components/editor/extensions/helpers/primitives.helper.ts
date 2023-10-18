import { TransactionSpec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';


export class PrimitivesHelper {
  static toggle(view: EditorView, regex: RegExp, template: string): TransactionSpec | null {
    const range = view.state.selection.main;
    const selection = view.state.sliceDoc(range.from, range.to);

    const value = this.transform(selection, regex, template);

    return {
      changes: { from: range.from, to: range.to, insert: value },
      selection: { anchor: range.from, head: range.from + value.length }
    };
  }

  static toggleBold(view: EditorView): TransactionSpec | null {
    return this.toggle(view, /^\*\*(.+)\*\*$/g, '**${text}**');
  }

  static toggleItalic(view: EditorView): TransactionSpec | null {
    return this.toggle(view, /^[*](.+)[*]$/g, '*${text}*');
  }

  static toggleStrike(view: EditorView): TransactionSpec | null {
    return this.toggle(view, /^~~(.+)~~$/g, '~~${text}~~');
  }

  private static transform(value: string, regex: RegExp, template: string): string {
    return value.match(regex) ? value.replace(regex, '$1') : template.replace(/\$\{text\}/gi, value);
  }
}
