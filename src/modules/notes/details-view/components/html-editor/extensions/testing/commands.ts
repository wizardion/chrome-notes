import { EditorView } from 'prosemirror-view';
import { EditorState, Transaction } from 'prosemirror-state';
import { findWrapping } from 'prosemirror-transform';
// import { toggleMark } from 'prosemirror-commands';
// import { UrlHelper } from '../helpers/url.helper';


export function makeNoteGroup(state: EditorState, dispatch: (tr: Transaction) => void, view?: EditorView): boolean {
  // Get a range around the selected blocks
  const range = state.selection.$from.blockRange(state.selection.$to);
  // See if it is possible to wrap that range in a note group

  if (!state.schema.nodes.boring_paragraph) {
    return false;
  }

  // Otherwise, dispatch a transaction, using the `wrap` method to
  // create the step that does the actual wrapping.
  if (dispatch) {
    const wrapping = findWrapping(range, state.schema.nodes.boring_paragraph);

    // If not, the command doesn't apply
    if (!wrapping) {
      console.log('no wrapping');

      return false;
    }

    dispatch(state.tr.wrap(range, wrapping).scrollIntoView());
  }

  return true;
}

// export function toggleLink(state: EditorState, dispatch: (tr: Transaction) => void, view?: EditorView): boolean {
//   const { doc, selection } = state;
//   const linkAttr = { href: '' };

//   if (selection.empty) {
//     return false;
//   }

//   if (dispatch) {
//     if (!doc.rangeHasMark(selection.from, selection.to, state.schema.marks.link)) {
//       const { $from, $to } = state.selection;
//       const selectedText = state.doc.textBetween($from.pos, $to.pos, '\n');

//       // if (!selectedText.match(UrlHelper.tester) &&
//       //   $from.parent.canReplaceWith($from.index(), $from.index(), state.schema.nodes.text)) {
//       //   const transaction = UrlHelper.transformText($from.pos, $to.pos, selectedText);

//       //   console.log('transaction', transaction);
//       //   // dispatch(state.tr.replaceWith($from.pos, $to.pos, state.schema.text(trans.changes.insert)));
//       // }
//       // else {
//       //   console.log('transformUrl', [UrlHelper.url(selectedText)]);
//       // }


//       if (!linkAttr.href) {
//         // const type = state.schema.nodes.text;
//         // const { $from } = state.selection;


//         // if ($from.parent.canReplaceWith($from.index(), $from.index(), type)) {
//         //   dispatch(state.tr.replaceSelectionWith(type.create()));
//         // }

//         // if ($from.parent.canReplaceWith($from.index(), $from.index(), type)) {
//         //   const a = type.create();

//         //   dispatch(state.tr.replaceSelectionWith(a));
//         // }

//         // dispatch(state.tr.);

//         // console.log('state.selection', state.doc.slice());

//         return false;
//       }
//     }

//     return toggleMark(state.schema.marks.link, linkAttr)(state, dispatch);
//   }

//   return true;
// }

export function insertStar(state: EditorState, dispatch: (tr: Transaction) => void, view?: EditorView): boolean {
  const type = state.schema.nodes.star;
  const { $from } = state.selection;

  if (dispatch) {
    if (!$from.parent.canReplaceWith($from.index(), $from.index(), type)) {
      return false;
    }

    dispatch(state.tr.replaceSelectionWith(type.create()));
  }

  return true;
}
