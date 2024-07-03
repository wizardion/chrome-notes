export interface ISerializingAttributes {
  [key: string]: (number | string | boolean);
  index?: number | null;
  escape?: boolean | null;
}

export interface ISerializingMark {
  attrs: ISerializingAttributes;
  type: string;
}

export interface ISerializingNode {
  type: string;
  text?: string;
  marks?: ISerializingMark[],
  attrs?: ISerializingAttributes;
  content?: ISerializingNode[];
}

export interface ISerializingSchemaItem {
  toString: (content: string | string[], attrs?: ISerializingAttributes, depth?: number) => string;
  attrs?: ISerializingAttributes
}

export interface ISerializingSchema {
  nodes: Record<string, ISerializingSchemaItem>;
  marks: Record<string, ISerializingSchemaItem>;
}
