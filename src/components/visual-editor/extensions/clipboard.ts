import { Plugin, PluginKey } from 'prosemirror-state';
import { Slice } from 'prosemirror-model';
import { TextSerializer } from './serializer/text-serializer';


export function clipboard(): Plugin {
  return new Plugin({
    key: new PluginKey('clipboardTextSerializer'),
    props: {
      clipboardTextSerializer: (slice: Slice): string => {
        return TextSerializer.serialize(slice.content);
      },
    }
  });
}
