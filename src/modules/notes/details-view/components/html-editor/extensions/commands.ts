import { EditorState, Transaction } from 'prosemirror-state';
import { UrlHelper } from './helpers/url.helper';
import { FormatHelper } from './helpers/format.helper';
import { MarkdownSerializer } from './serializer/serializer';
import { ListHelper } from './helpers/list.helper';


export function toggleLink(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  if (dispatch) {
    const transaction = UrlHelper.toggle(state);

    if (transaction) {
      dispatch(transaction);
    }
  }

  return UrlHelper.check(state);
}

export function toggleList(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  if (dispatch) {
    const transaction = ListHelper.toggle(state);

    if (transaction) {
      dispatch(transaction);
    }
  }

  return UrlHelper.check(state);
}

export function removeFormat(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  if (dispatch) {
    const transaction = FormatHelper.toggle(state);

    if (transaction) {
      dispatch(transaction);
    }
  }

  return FormatHelper.check(state);
}

export function toMarkdown(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  if (dispatch) {
    MarkdownSerializer.serialize(state);
  }

  return true;
}
