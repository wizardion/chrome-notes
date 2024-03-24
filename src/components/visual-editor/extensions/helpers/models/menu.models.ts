import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';


export interface IMenuItem {
  command: (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView) => boolean;
  dom: HTMLInputElement | null,
  event?: (e: MouseEvent | KeyboardEvent) => void;
}
