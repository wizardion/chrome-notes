import { Fragment } from 'prosemirror-model';
import { MarkdownSerializer } from './serializer';
import { textSerializingSchema } from './text-schema';
import { ISerializingNode } from './models/serializer.models';


export class TextSerializer extends MarkdownSerializer {
  protected static schema = textSerializingSchema;

  static serializeInline(fragment: Fragment): string {
    for (let i = 0; i < fragment.childCount; i++) {
      const node = fragment.child(i).toJSON() as ISerializingNode;
      const inline = this.renderInline(node.content);

      if (inline.length) {
        return inline.join('');
      }
    }

    return '';
  }

  static renderInline(content: ISerializingNode[]): string[] {
    let result: string[] = [];

    content?.some(item => {
      if (item.type !== 'text' && this.schema.nodes[item.type]) {
        result = result.concat(this.renderInline(item.content));

        return result.length;
      }

      if (item.type === 'text') {
        result = result.concat(this.toString(item));
      }
    });

    return result;
  }
}
