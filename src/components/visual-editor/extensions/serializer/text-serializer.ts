import { MarkdownSerializer } from './serializer';
import { textSerializingSchema } from './text-schema';


export class TextSerializer extends MarkdownSerializer {
  protected static schema = textSerializingSchema;
}
