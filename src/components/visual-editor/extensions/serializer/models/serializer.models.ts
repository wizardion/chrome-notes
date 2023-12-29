export type ISerializingAttributes = Record<string, (number | string)>;

export interface ISerializingMark {
  attrs: ISerializingAttributes;
  type: string;
}

export interface ISerializingContent {
  type: string;
  text: string;
  marks: ISerializingMark[],
}

export interface ISerializingNode {
  type: string;
  attrs?: ISerializingAttributes;
  content: ISerializingContent[];
}

export interface ISerializingSchemaItem {
  toString: (content: string, attrs?: Record<string, number | string>) => string;
}

export interface ISerializingSchema {
  nodes: Record<string, ISerializingSchemaItem>;
  marks: Record<string, ISerializingSchemaItem>;
}
