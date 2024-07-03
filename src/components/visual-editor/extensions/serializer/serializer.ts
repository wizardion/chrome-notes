import { ISerializingAttributes, ISerializingNode } from './models/serializer.models';
import { serializingSchema } from './md-schema';
import { Fragment } from 'prosemirror-model';
import { MarkdownRender } from 'modules/markdown';


export class MarkdownSerializer {
  public static md = new MarkdownRender();
  protected static schema = serializingSchema;

  static serialize(content: Fragment): string {
    const blocks: string[] = [];

    content.forEach(block => {
      const node = block.toJSON() as ISerializingNode;

      if (this.schema.nodes[node.type]) {
        blocks.push(this.renderBlock(node));
      }
    });

    return blocks.join('\n');
  }

  protected static renderBlock(node: ISerializingNode, depth = 0): string {
    const block = this.schema.nodes[node.type];
    const content = this.gerContent(node.content, { ...node.attrs, ...block.attrs }, depth + 1);

    return block.toString(content, node.attrs, depth);
  }

  protected static gerContent(content: ISerializingNode[], attrs: ISerializingAttributes, depth: number): string[] {
    const result: string[] = [];

    content?.forEach((node, index) => {
      if (node.type !== 'text' && this.schema.nodes[node.type]) {
        node.attrs = { ...attrs, ...node.attrs, index: index } as ISerializingAttributes;

        result.push(this.renderBlock(node, depth));
      }

      if (node.type === 'text') {
        result.push(this.toString(node, attrs.escape));
      }
    });

    return result;
  }

  protected static toString(node: ISerializingNode, escape: boolean = false): string {
    let text = escape ? this.md.escape(node.text) : node.text;

    node.marks?.forEach(item => {
      const mark = this.schema.marks[item.type];

      if (mark) {
        text = mark.toString(text, item.attrs);
      }
    });

    return text;
  }
}
