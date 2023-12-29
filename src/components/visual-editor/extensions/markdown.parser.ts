import { MarkdownParser } from 'prosemirror-markdown';
import * as MarkdownIt from 'markdown-it';
import * as Token from 'markdown-it/lib/token';
import { schema } from './schema';


export const md = new MarkdownIt('commonmark', { html: false });

// console.log('md', md.);

export const markdownParser = new MarkdownParser(schema, md, {});

// console.log('', markdownParser.tokens);
