import { MarkdownParser } from 'prosemirror-markdown';
import * as MarkdownIt from 'markdown-it';
import { schema } from './schema';


export const md = new MarkdownIt('commonmark', { html: false });

export const markdownParser = new MarkdownParser(schema, md, {});
