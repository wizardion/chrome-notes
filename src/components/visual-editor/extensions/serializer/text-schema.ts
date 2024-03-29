import { ISerializingSchema } from './models/serializer.models';


export const textSerializingSchema: ISerializingSchema = {
  nodes: {
    heading: {
      toString(content: string) {
        return `${content}\n`;
      }
    },
    bulletList: {
      attrs: { listType: '' },
      toString(content: string) {
        return content;
      }
    },
    orderedList: {
      attrs: { listType: '' },
      toString(content: string) {
        return content;
      }
    },
    listItem: {
      toString(content: string) {
        return content.replace(/\n(?!$)/g, `\n`);
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
    },
    codeBlock: {
      toString(content: string) {
        return content + '\n';
      }
    },
    blockquote: {
      toString(content: string) {
        return content + '\n';
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
        return content.replace(/^(\s*)(\S.+\S)(\s*)$/g, '$1$2$3');
      }
    },
    strong: {
      toString(content: string) {
        return content.replace(/^(\s*)(\S.+\S)(\s*)$/g, '$1$2$3');
      }
    },
    italic: {
      toString(content: string) {
        return content.replace(/^(\s*)(\S.+\S)(\s*)$/g, '$1$2$3');
      }
    },
    strike: {
      toString(content: string) {
        return content.replace(/^(\s*)(\S.+\S)(\s*)$/g, '$1$2$3');
      }
    }
  }
};
