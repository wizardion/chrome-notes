import { Line, TransactionSpec } from '@codemirror/state';
import { EditorView } from '@codemirror/view';


export class ListHelper {
  private static tester = /^\s*(\d.\s|-\s|\*\s)(\[[\s\x]\]\s)?/g;
  private static replacer = /^(\s*((\d.\s|-\s|\*\s)(\[[\s\x]\]\s)?)?)(.*)/g;

  static toggle(view: EditorView, template: string): TransactionSpec | null {
    const range = view.state.selection.main;
    const [fist, second] = [view.state.doc.lineAt(range.from), view.state.doc.lineAt(range.to)];

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
    let prev = view.state.doc.line(fist.number > 1 ? fist.number - 1 : 1).text;
    const tab = ' '.repeat(view.state.tabSize);
    const lines: string[] = [];
    let toList = null;

    for (let i = fist.number; i <= second.number; i++) {
      const line = view.state.doc.line(i);
      const text = line.text.trim();

      if (text.length) {
        if (toList === null) {
          toList = !this.belongsToList(line.text, prev);
        }

        lines.push(this.transform(toList, line.text, prev, template, tab));
      } else {
        lines.push(line.text);
      }

      prev = lines[lines.length - 1];
    }

    return lines;
  }

  private static transform(toList: boolean, line: string, prev: string, template: string, tab: string): string {
    if (toList) {
      return this.belongsToList(line, prev)
        ? prev.replace(this.replacer, `${tab}${line}`)
        : prev.match(this.tester) ?  prev.replace(this.replacer, `$1${line}`) : `${template}${line}`;
    }

    return line.replace(this.replacer, '$5');
  }

  private static belongsToList(current: string, previous: string): boolean {
    return !!current.match(this.tester) || (!!previous.match(this.tester) && !!current.match(/^\s+/g));
  }
}
