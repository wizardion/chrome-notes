import { ISerializingSchema } from './models/serializer.models';


export const serializingSchema: ISerializingSchema = {
  nodes: {
    heading: {
      toString(content: string, attrs?: Record<string, any>) {
        const level = attrs.level as number;
        const levels: Record<number, string> = {
          1: '#',
          2: '##',
          3: '###',
          4: '####',
          5: '#####',
          6: '######',
        };

        return `${levels[level]} ${content}`;
      }
    },
    paragraph: {
      toString(content: string) {
        return content;
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
        return `**${content}**`;
      }
    },
    italic: {
      toString(content: string) {
        return `*${content}*`;
      }
    },
    strike: {
      toString(content: string) {
        return `~~${content}~~`;
      }
    },
    link: {
      toString(content: string, attrs?: Record<string, any>) {
        const href = attrs?.href as string;

        return `[${content}](${href})`;
      }
    }
  }
};
