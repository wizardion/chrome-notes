import { EditorState, Plugin } from 'prosemirror-state';
import { CursorView } from './helpers/cursor.view';
import { Decoration, DecorationSet } from 'prosemirror-view';


export function virtualCursor(): Plugin {
  return new Plugin({
    view(editorView) {
      return new CursorView(editorView);
    },
    props: {
      decorations: (state: EditorState) => {
        return DecorationSet.create(state.doc, [
          Decoration.widget(0, CursorView.widget, {
            key: 'virtual-selection',
            side: -1,
            ignoreSelection: true
          }),
        ]);
      },
      attributes: {
        class: 'vr-selection-enabled',
      },
    }
  });
}
