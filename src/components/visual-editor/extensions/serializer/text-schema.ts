import { ISerializingSchema } from './models/serializer.models';


export const textSerializingSchema: ISerializingSchema = {
  nodes: {
    heading: {
      toString(content: string[]) {
        return `${content.join('')}\n`;
      }
    },
    bulletList: {
      attrs: { listType: '' },
      toString(content: string[]) {
        return content.join('\n');
      }
    },
    orderedList: {
      attrs: { listType: '' },
      toString(content: string[]) {
        return content.join('\n');
      }
    },
    listItem: {
      toString(content: string[]) {
        return content.join('\n');
      }
    },
    paragraph: {
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
        return content.join('');
      }
    },
    blockquote: {
      toString(content: string[]) {
        return content.join('') + '\n';
      }
    },
    text: {
      toString(content: string) {
        return content;
      }
    }
  },
  marks: {
    link: {
      toString(content: string) {
        return content;
      }
    },
    code: {
      toString(content: string) {
        return content.replace(/^(\s*)(.+)(\s*)$/g, '$1$2$3');
      }
    },
    strong: {
      toString(content: string) {
        return content.replace(/^(\s*)(.+)(\s*)$/g, '$1$2$3');
      }
    },
    italic: {
      toString(content: string) {
        return content.replace(/^(\s*)(.+)(\s*)$/g, '$1$2$3');
      }
    },
    strike: {
      toString(content: string) {
        return content.replace(/^(\s*)(.+)(\s*)$/g, '$1$2$3');
      }
    }
  }
};
