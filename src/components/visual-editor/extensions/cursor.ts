import { EditorState, Plugin } from 'prosemirror-state';
import { CursorView } from './helpers/cursor.view';
import { Decoration, DecorationSet } from 'prosemirror-view';


export function virtualCursor(): Plugin {
  let cursorView: CursorView;

  return new Plugin({
    view(editorView) {
      cursorView = new CursorView(editorView);

      return cursorView;
    },
    props: {
      decorations: (state: EditorState) => {
        if (cursorView) {
          return DecorationSet.create(state.doc, [
            Decoration.widget(0, cursorView.layer, {
              key: 'virtual-selection',
              side: -1,
              ignoreSelection: true
            }),
          ]);
        }

        return null;
      },
      attributes: {
        class: 'vr-selection-enabled',
      },
    }
  });
}
