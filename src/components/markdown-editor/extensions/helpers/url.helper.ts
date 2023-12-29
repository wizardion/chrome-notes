import { SelectionRange, TransactionSpec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';


export class UrlHelper {
  private static tester = /^\s*\[(.*)\]\((.+)\)\s*/g;
  private static urlPart = /^\]\((.+)\)/g;
  private static template = '[${text}](url)';

  static toggle(view: EditorView): TransactionSpec | null {
    const range = view.state.selection.main;
    const selection = view.state.sliceDoc(range.from, range.to);

    return this.processUrl(view, range, selection);
  }

  static processUrl(view: EditorView, range: SelectionRange, selection: string): TransactionSpec | null {
    if (selection.length > 0 && !selection.match(this.tester)) {
      const part = view.state.sliceDoc(range.from - 2, range.to + 1);

      if (part.match(this.urlPart)) {
        const line = view.state.doc.lineAt(range.from);
        const index = line.text.lastIndexOf('[', (range.from - 2) - line.from);

        if (index >= 0) {
          const text = line.text.substring(index, (range.to + 1) - line.from);

          return this.transformUrl(line.from + index, range.to + 1, text);
        }
      }
    }

    return this.transformText(range.from, range.to, selection);
  }

  private static transformUrl(from: number, to: number, selection: string): TransactionSpec | null {
    const value = selection.replace(this.tester, '$1');

    return {
      changes: { from: from, to: to, insert: value },
      selection: { anchor: from, head: from + value.length }
    };
  }

  private static transformText(from: number, to: number, selection: string): TransactionSpec | null {
    const value = this.template.replace(/\$\{text\}/gim, selection);

    return {
      changes: { from: from, to: to, insert: value },
      selection: { anchor: from + value.length - 4, head: from + value.length - 1 }
    };
  }
}
