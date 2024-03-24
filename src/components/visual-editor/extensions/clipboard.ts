import { Plugin, PluginKey } from 'prosemirror-state';
import { Slice } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { TextSerializer } from './serializer/text-serializer';


export function clipboard(): Plugin {
  return new Plugin({
    key: new PluginKey('clipboardTextSerializer'),
    props: {
      clipboardTextSerializer: (slice: Slice, view: EditorView): string => {
        return TextSerializer.serialize(view.state, slice.content);
      },
    }
  });
}
