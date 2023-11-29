import * as MarkdownIt from 'markdown-it';
import * as Renderer from 'markdown-it/lib/renderer';
import * as Token from 'markdown-it/lib/token';
import taskLists from '@hedgedoc/markdown-it-task-lists';

// const taskLists = require('markdown-it-task-lists');

type IOptions = MarkdownIt.Options;

class MarkdownRender {
  private md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt({ linkify: true, breaks: true }).use(taskLists);

    this.md.renderer.rules['link_open'] = this.linkOpen.bind(this);
  }

  public render(text: string): string {
    const html = this.md.render(text.replace(/^(\n|[ ]+\n|[ ]{2,3}(?=\w))/gim, '$1\\=\\?$1'));

    return html.replace(/=\?/gi, '&nbsp;');
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

  // // https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
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
