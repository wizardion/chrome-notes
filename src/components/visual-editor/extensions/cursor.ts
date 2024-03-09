import { EditorState, Plugin } from 'prosemirror-state';
import { CursorView } from './helpers/cursor.view';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';


export function virtualCursor(): Plugin {
  let view: CursorView;

  return new Plugin({
    view(editorView) {
      view = new CursorView(editorView);

      return view;
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
      handleKeyDown: (v: EditorView, e: KeyboardEvent): boolean => view?.handleKeyDown(v, e),
      attributes: {
        class: 'vr-selection-enabled',
      },
    }
  });
}
