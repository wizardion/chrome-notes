import { EditorState } from 'prosemirror-state';


export abstract class BaseHelper {
  static check(state: EditorState): boolean {
    return !state.selection.empty;
  }
}
