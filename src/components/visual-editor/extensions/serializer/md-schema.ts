import { ISerializingAttributes, ISerializingSchema } from './models/serializer.models';


export const serializingSchema: ISerializingSchema = {
  nodes: {
    heading: {
      attrs: { escape: true },
      toString(content: string[], attrs?: ISerializingAttributes) {
        const level = attrs.level as number;
        const levels: Record<number, string> = {
          1: '#',
          2: '##',
          3: '###',
          4: '####',
          5: '#####',
          6: '######',
        };

        return `${levels[level]} ${content.join('')}`;
      }
    },
    bulletList: {
      attrs: { listType: '-' },
      toString(content: string[]) {
        return content.join('\n');
      }
    },
    orderedList: {
      attrs: { listType: '1.' },
      toString(content: string[]) {
        return content.join('\n');
      }
    },
    listItem: {
      toString(content: string[], attrs: ISerializingAttributes) {
        const { index, listType } = attrs;
        const mark = (listType as string).replace(/^\d/, `${(index + 1)}`) + ' ';
        const lines = content.flatMap(line => line.split('\n'));

        return mark + lines.join('\n' + ' '.repeat(mark.length));
      }
    },
    paragraph: {
      attrs: { escape: true },
      toString(content: string[]) {
        return content.join('');
      }
    },
    break: {
      toString() {
        return '\n';
      }
    },
    codeBlock: {
      toString(content: string[]) {
        return '```\n' + content.join('') + '\n```';
      }
    },
    blockquote: {
      toString(content: string[]) {
        return '> ' + content.join('') + '\n';
      }
    },
  },
  marks: {
    link: {
      toString(content: string, attrs?: ISerializingAttributes) {
        const href = attrs?.href as string;

        return `[${content}](${href})`;
      }
    },
    code: {
      toString(content: string) {
        return content.replace(/^(\s*)(.+)(\s*)$/g, '$1`$2`$3');
      }
    },
    strong: {
      toString (content: string) {
        return content.replace(/^(\s*)(.+)(\s*)$/g, '$1**$2**$3');
      }
    },
    italic: {
      toString(content: string) {
        return content.replace(/^(\s*)(.+)(\s*)$/g, '$1*$2*$3');
      }
    },
    strike: {
      toString(content: string) {
        return content.replace(/^(\s*)(.+)(\s*)$/g, '$1~~$2~~$3');
      }
    }
  }
};
