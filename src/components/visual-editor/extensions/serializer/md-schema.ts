import { ISerializingAttributes, ISerializingSchema } from './models/serializer.models';


export const serializingSchema: ISerializingSchema = {
  nodes: {
    heading: {
      toString(content: string, attrs?: ISerializingAttributes) {
        const level = attrs.level as number;
        const levels: Record<number, string> = {
          1: '#',
          2: '##',
          3: '###',
          4: '####',
          5: '#####',
          6: '######',
        };

        return `${levels[level]} ${content}\n`;
      }
    },
    bulletList: {
      attrs: { listType: '-' },
      toString(content: string) {
        return content;
      }
    },
    orderedList: {
      attrs: { listType: '1.' },
      toString(content: string) {
        return content;
      }
    },
    listItem: {
      toString(content: string, attrs: ISerializingAttributes, depth?: number) {
        const { index, listType } = attrs;
        const indent = (depth - 1 > 0) ? ' '.repeat(depth) : '';
        const mark = indent + (listType as string).replace(/^\d/, `${(index + 1)}`) + ' ';

        return mark + content.replace(/\n(?!$)/g, `\n${' '.repeat(mark.length)}`);
      }
    },
    paragraph: {
      toString(content: string) {
        return content + '\n';
      }
    },
    break: {
      toString() {
        return '\n';
      }
    }
  },
  marks: {
    strong: {
      toString(content: string) {
        return content.replace(/^(\s*)(\S.+\S)(\s*)$/g, '$1**$2**$3');
      }
    },
    italic: {
      toString(content: string) {
        return content.replace(/^(\s*)(\S.+\S)(\s*)$/g, '$1*$2*$3');
      }
    },
    strike: {
      toString(content: string) {
        return content.replace(/^(\s*)(\S.+\S)(\s*)$/g, '$1~~$2~~$3');
      }
    },
    link: {
      toString(content: string, attrs?: ISerializingAttributes) {
        const href = attrs?.href as string;

        return `[${content}](${href})`;
      }
    }
  }
};
