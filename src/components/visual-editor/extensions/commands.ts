import { EditorState, Transaction, Command } from 'prosemirror-state';
import { UrlHelper } from './helpers/url.helper';
import { FormatHelper } from './helpers/format.helper';
import { MarkdownSerializer } from './serializer/serializer';
import { ListCommandHelper } from './helpers/list.helper';
import { Fragment, NodeType } from 'prosemirror-model';
import { TextSerializer } from './serializer/text-serializer';
import { liftListItem, sinkListItem } from 'prosemirror-schema-list';


export function toggleLink(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  if (dispatch) {
    const transaction = UrlHelper.toggle(state);

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
    // console.clear();
    const content = MarkdownSerializer.serialize(state);

    console.log('');
    console.log(content);
    console.log('');
  }

  return true;
}

export function toString(state: EditorState, dispatch: (tr: Transaction) => void): boolean {
  if (dispatch) {
    // console.clear();
    const content = TextSerializer.serialize(state);

    console.log('');
    console.log(content);
    console.log('');
  }

  return true;
}

// TODO to be implemented.
export function indent(item: NodeType): Command {
  const sinkCommand = sinkListItem(item);
  const command = (state: EditorState, dispatch: (tr: Transaction) => void): boolean => {
    if (dispatch && !sinkCommand(state, dispatch)) {
      const transaction = state.tr;

      dispatch(transaction.insertText('  '));

      return true;
    }

    return true;
  };

  return command;
}

export function unindent(item: NodeType): Command {
  const liftCommand = liftListItem(item);
  const command = (state: EditorState, dispatch: (tr: Transaction) => void): boolean => {
    if (dispatch && !liftCommand(state, dispatch)) {
      const { from, to } = state.selection;

      if (from === to) {
        const transaction = state.tr;
        const text = state.doc.textBetween(from - 2, to, '\n');

        if (text === '  ') {
          dispatch(transaction.replaceWith(from - 2, to, Fragment.empty));
        }
      }

      return true;
    }

    return true;
  };

  return command;
}

export function toggleList(listType: NodeType): Command {
  const command = (state: EditorState, dispatch: (tr: Transaction) => void): boolean => {
    if (dispatch) {
      return ListCommandHelper.toggle(listType, state, dispatch);
    }

    return ListCommandHelper.check(state);
  };

  return command;
}
