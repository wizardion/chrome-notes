import { Plugin, PluginKey } from 'prosemirror-state';
import { Slice, DOMParser as EditorDOMParser, Schema } from 'prosemirror-model';
import { TextSerializer } from './serializer/text-serializer';


export function clipboard(schema: Schema): Plugin {
  const domParser = new DOMParser();
  const parser = EditorDOMParser.fromSchema(schema);

  return new Plugin({
    key: new PluginKey('clipboardTextSerializer'),
    props: {
      clipboardTextSerializer: (slice: Slice): string => {
        return TextSerializer.serialize(slice.content);
      },
      clipboardTextParser: (text: string, _: any, plain: boolean): Slice | null => {
        if (!plain) {
          const html = TextSerializer.md.render(text);
          const dom = domParser.parseFromString(html, 'text/html');

          return parser.parse(dom).slice(0);
        }

        const html = TextSerializer.md.render(TextSerializer.md.escape(text));
        const dom = domParser.parseFromString(html, 'text/html');

        return parser.parse(dom).slice(0);
      }
    }
  });
}
