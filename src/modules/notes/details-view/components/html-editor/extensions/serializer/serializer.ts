import { EditorState } from 'prosemirror-state';
import { ISerializingContent, ISerializingNode } from './models/serializer.models';
import { serializingSchema } from './md-schema';


export class MarkdownSerializer {
  private static schema = serializingSchema;

  static serialize(state: EditorState): string {
    const lines: string[] = [];
    const { schema } = state;

    state.doc.forEach(block => {
      const node = block.toJSON() as ISerializingNode;

      if (schema.nodes[node.type] && this.schema.nodes[node.type]) {
        lines.push(this.renderBlock(node));
      }
    });

    console.log('serialize..................');
    console.log(lines.join('\n'));

    return lines.join('\n');
  }

  private static renderBlock(node: ISerializingNode): string {
    const block = this.schema.nodes[node.type];

    console.log('node', node);

    return block.toString(this.gerContent(node.content), node.attrs);
  }

  private static gerContent(content: ISerializingContent[]) {
    const result: string[] = [];

    content.forEach(i => {
      if (i.type === 'text') {
        let text = i.text;

        if (i.marks) {
          i.marks.forEach(mark => {
            if (this.schema.marks[mark.type]) {
              text = this.schema.marks[mark.type].toString(text, mark.attrs);
            }
          });
        }

        result.push(text);
      } else if (this.schema.nodes[i.type]) {
        result.push(this.schema.nodes[i.type].toString(i.text));
      }
    });

    return result.join('');
  }
}
