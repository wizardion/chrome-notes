import markdownIt from 'markdown-it';

// // import { Token, Renderer, TokenRender } from 'markdown-it';
// const taskLists = require('markdown-it-task-lists');


export class MDRender {
  // private md: MarkdownIt;
  // private default: TokenRender;

  constructor() {
    // this.md = new MarkdownIt({ linkify: true, breaks: true }).use(taskLists);
    // this.default = this.md.renderer.rules['link_open'] || this.tokenRender.bind(this);
    // this.md.renderer.rules['link_open'] = this.linkOpen.bind(this);
  }

  public render(text: string): string {
    // const html = this.md.render(text.replace(/^(\n|[ ]+\n|[ ]{2,3}(?=\w))/gim, '$1\\=\\?$1'));
    // return html.replace(/\\=\\?/gi, '&nbsp;');
    return text;
  }

  public unescapeAll(text: string): string {
    // return this.md.utils.unescapeAll(text);
    return text;
  }

  // private tokenRender(tokens: Token[], id: number, options: any, env: any, self: Renderer) {
  //   return self.renderToken(tokens, id, options);
  // }

  // // https://github.com/markdown-it/markdown-it/blob/master/docs/architecture.md#renderer
  // private linkOpen(tokens: Token[], id: number, options: any, env: any, self: Renderer) {
  //   // If you are sure other plugins can't add `target` - drop check below
  //   const aIndex = tokens[id].attrIndex('target');

  //   if (aIndex < 0) {
  //     tokens[id].attrPush(['target', '_blank']); // add new attribute
  //   } else {
  //     tokens[id].attrs[aIndex][1] = '_blank';    // replace value of existing attr
  //   }

  //   // pass token to default renderer.
  //   return this.default(tokens, id, options, env, self);
  // }
}
