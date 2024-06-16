import { Line, TransactionSpec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';


export class HeadingHelper {
  private static tester: RegExp;
  private static replacer = /^(\s*((#{1,6}\s)(\[[\s\x]\]\s)?)?)(.*)/g;

  static toggle(view: EditorView, template: string): TransactionSpec | null {
    const range = view.state.selection.main;
    const [fist, second] = [view.state.doc.lineAt(range.from), view.state.doc.lineAt(range.to)];

    this.tester = new RegExp(`^\\s*(${template || '\\w'})(\\[[\\s\\x]\\]\\s)?`, 'g');

    const lines = this.processLines(view, fist, second, template);
    const value = lines.join(view.state.lineBreak);

    return {
      changes: { from: fist.from, to: second.to, insert: value },
      selection: {
        anchor: range.from + (lines[0].length - fist.text.length),
        head: range.to + value.length - (second.to - fist.from)
      }
    };
  }

  private static processLines(view: EditorView, fist: Line, second: Line, template: string): string[] {
    const lines: string[] = [];

    for (let i = fist.number; i <= second.number; i++) {
      const line = view.state.doc.line(i);
      const text = line.text.trim();

      if (text.length && !this.belongs(line.text)) {
        lines.push(line.text.replace(this.replacer, `${template}$5`));
      } else {
        lines.push(line.text);
      }
    }

    return lines;
  }

  private static belongs(current: string): boolean {
    return !!current.match(this.tester);
  }
}
