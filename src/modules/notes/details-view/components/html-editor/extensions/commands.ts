import { EditorState, Transaction } from 'prosemirror-state';
import { UrlHelper } from './helpers/url.helper';


export function toggleLink(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  if (dispatch) {
    const transaction = UrlHelper.toggle(state);

    if (transaction) {
      dispatch(transaction);
    }
  }

  return UrlHelper.check(state);
}
