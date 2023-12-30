import { EditorState } from 'prosemirror-state';
import { ISerializingAttributes, ISerializingNode } from './models/serializer.models';
import { serializingSchema } from './md-schema';


export class MarkdownSerializer {
  private static schema = serializingSchema;

  static serialize(state: EditorState): string {
    const { schema } = state;
    const blocks: string[] = [];

    state.doc.forEach(block => {
      const node = block.toJSON() as ISerializingNode;

      if (schema.nodes[node.type] && this.schema.nodes[node.type]) {
        blocks.push(this.renderBlock(node));
      }
    });

    return blocks.join('');
  }

  private static renderBlock(node: ISerializingNode, depth = 0): string {
    const block = this.schema.nodes[node.type];
    const content = this.gerContent(node.content || [], block.attrs, depth + 1);

    return block.toString(content, node.attrs, depth);
  }

  private static gerContent(content: ISerializingNode[], attrs: ISerializingAttributes, depth: number): string {
    const result: string[] = [];

    content.forEach((node, index) => {
      if (node.content) {
        node.attrs = Object.assign({}, attrs, node.attrs, { index: index });

        return result.push(this.renderBlock(node, depth));
      }

      if (node.type === 'text') {
        result.push(this.toString(node));
      }
    });

    return result.join('');
  }

  private static toString(node: ISerializingNode): string {
    let text = node.text;

    node.marks?.forEach(item => {
      const mark = this.schema.marks[item.type];

      if (mark) {
        text = mark.toString(text, item.attrs);
      }
    });

    return text;
  }
}
