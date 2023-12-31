import * as MarkdownIt from 'markdown-it';
import * as Renderer from 'markdown-it/lib/renderer';
import * as Token from 'markdown-it/lib/token';


// import taskLists from '@hedgedoc/markdown-it-task-lists';
// const taskLists = require('markdown-it-task-lists');
type IOptions = MarkdownIt.Options;

class MarkdownRender {
  private md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt('commonmark', { html: false, linkify: true, breaks: false });

    this.md.renderer.rules['link_open'] = this.linkOpen.bind(this);
  }

  public render(text: string, trailingSpaces = ''): string {
    const lines = text.split('\n');
    const stack: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      if (!line.length) {
        line += '\\';
      }

      stack.push(line + '\n');
    }

    return this.md.render(stack.join('\n')).replace(/<p>\\<\/p>/g, `<p><span>${trailingSpaces}</span></p>`);
  }

  public parse(value: string, env: any): Token[] {
    return this.md.parse(value, env);
  }

  public unescapeAll(text: string): string {
    return this.md.utils.unescapeAll(text);
  }

  private tokenRender(tokens: Token[], id: number, options: IOptions, self: Renderer) {
    return self.renderToken(tokens, id, options);
  }

  // https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
  private linkOpen(tokens: Token[], id: number, options: IOptions, env: object, self: Renderer) {
    const aIndex = tokens[id].attrIndex('target');

    if (aIndex < 0) {
      tokens[id].attrPush(['target', '_blank']);
    } else {
      tokens[id].attrs[aIndex][1] = '_blank';
    }

    return this.tokenRender(tokens, id, options, self);
  }
}

export const mdRender = new MarkdownRender();
