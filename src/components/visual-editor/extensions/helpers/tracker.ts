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

    if (previous && !previous.doc.eq(state.doc)) {
      return this.listener(new Event('change'));
    }

    if (previous && !previous.selection.eq(state.selection)) {
      return this.listener(new Event('selection'));
    }
  }
}
