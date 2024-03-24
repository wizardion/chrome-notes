import { EditorState, Plugin } from 'prosemirror-state';
import { CursorLinkView } from './helpers/cursor-link.view';
import { Decoration, DecorationSet } from 'prosemirror-view';


export function cursorLink(): Plugin {
  return new Plugin({
    view(editorView) {
      return new CursorLinkView(editorView);
    },
    props: {
      decorations: (state: EditorState) => {
        return DecorationSet.create(state.doc, [
          Decoration.widget(0, CursorLinkView.widget, {
            key: 'vr-cursor-link',
            side: -1,
            ignoreSelection: true
          }),
        ]);
      },
      attributes: {
        class: 'vr-cursor-link',
      },
    }
  });
}
