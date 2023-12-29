import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { RemoveMarkStep } from 'prosemirror-transform';
import { BaseHelper } from './base.helper';


export class UrlHelper extends BaseHelper {
  private static tester = /^\s*\[(?<text>.*)\]\((?<url>.+)\)\s*/g;
  private static template = '[${text}](url)';

  static toggle(state: EditorState): Transaction | null {
    const { doc, selection } = state;

    if (!selection.empty) {
      const { $from, $to } = state.selection;

      if (!doc.rangeHasMark(selection.from, selection.to, state.schema.marks.link)) {
        const selectedText = state.doc.textBetween($from.pos, $to.pos, '\n');

        if ($from.parent.canReplaceWith($from.index(), $from.index(), state.schema.nodes.text)) {
          const match = this.tester.exec(selectedText);

          if (!match) {
            return this.transformText(state, $from.pos, $to.pos, selectedText);
          } else {
            const { text, url } = match.groups;

            return this.transformLink(state, $from.pos, $to.pos, text, url);
          }
        }
      } else {
        return this.removeLink(state, $from.pos, $to.pos);
      }
    }

    return null;
  }

  private static transformText(state: EditorState, from: number, to: number, selectedText: string): Transaction {
    const value = this.template.replace(/\$\{text\}/gim, selectedText);
    const transaction = state.tr.replaceWith(from, to, state.schema.text(value));

    transaction.setSelection(TextSelection.create(transaction.doc, from + value.length - 4, from + value.length - 1));

    return transaction;
  }

  private static transformLink(state: EditorState, from: number, to: number, text: string, url: string): Transaction {
    const transaction = state.tr.replaceWith(from, to, state.schema.text(text));

    transaction.addMark(from, from + text.length, state.schema.marks.link.create({ href: url }));

    return transaction;
  }

  private static removeLink(state: EditorState, from: number, to: number): Transaction {
    const transaction = state.tr.removeMark(from, to, state.schema.marks.link);
    const steps = transaction.steps.filter((s) => s instanceof (RemoveMarkStep)) as RemoveMarkStep[];

    if (steps?.length) {
      let intended = 0;

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const text = state.doc.textBetween(step.from, step.to, '\n');
        const textLink = this.template.replace('url', step.mark.attrs.href).replace(/\$\{text\}/gim, text);

        transaction.replaceWith(step.from + intended, step.to + intended, state.schema.text(textLink));

        if (steps.length === 1) {
          transaction.setSelection(
            TextSelection.create(
              transaction.doc,
              step.from + textLink.length - step.mark.attrs.href.length - 1,
              step.from + textLink.length - 1)
          );
        }

        intended += (textLink.length - text.length);
      }
    }

    return transaction;
  }
}
