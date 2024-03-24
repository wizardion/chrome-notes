import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { IEventListener } from 'core/components';


export class TrackerView {
  private listener: IEventListener;

  constructor(listener: IEventListener) {
    this.listener = listener;
  }

  update(view: EditorView, previous: EditorState) {
    const state = view.state;
    const selection = state.selection;

    // Don't do anything if the document/selection didn't change
    if (!previous || previous.doc.eq(state.doc) && previous.selection.eq(selection)) {
      return;
    }

    this.listener(new Event('change'));
  }
}
