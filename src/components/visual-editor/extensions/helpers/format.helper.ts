import { EditorState, Transaction } from 'prosemirror-state';
import { BaseHelper } from './base.helper';


export class FormatHelper extends BaseHelper {
  private static tester = /^\s*\[(?<text>.*)\]\((?<url>.+)\)\s*/g;
  private static template = '[${text}](url)';

  static toggle(state: EditorState): Transaction | null {
    const { selection } = state;

    if (!selection.empty) {
      const { $from, $to } = selection;

      return this.removeMarks(state, $from.pos, $to.pos);
    }

    return null;
  }

  private static removeMarks(state: EditorState, from: number, to: number): Transaction {
    const doc = state.doc;
    const transaction = state.tr;
    const marks = state.schema.marks;
    const keys = Object.keys(marks);

    for (let i = 0; i < keys.length; i++) {
      const mark = marks[keys[i]];

      if (doc.rangeHasMark(from, to, mark)) {
        transaction.removeMark(from, to, mark);
      }
    }

    return transaction;
  }
}
