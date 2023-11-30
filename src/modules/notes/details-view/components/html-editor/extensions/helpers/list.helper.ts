import { EditorState, TextSelection, Transaction } from 'prosemirror-state';
import { RemoveMarkStep } from 'prosemirror-transform';
import { BaseHelper } from './base.helper';


export class ListHelper extends BaseHelper {
  private static tester = /^\s*\[(?<text>.*)\]\((?<url>.+)\)\s*/g;
  private static template = '[${text}](url)';

  static toggle(state: EditorState): Transaction | null {
    const { doc, selection } = state;

    if (!selection.empty) {
      const { $from, $to } = state.selection;
    }

    return null;
  }
}
