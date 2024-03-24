import * as Renderer from 'markdown-it/lib/renderer';
import MarkdownIt from 'markdown-it';
// import taskLists from '@hedgedoc/markdown-it-task-lists';


type IOptions = MarkdownIt.Options;
type Token = MarkdownIt.Token;

// TODO temporary solution
class MarkdownRender {
  private md: MarkdownIt;
  private div: HTMLDivElement;

  constructor() {
    this.md = new MarkdownIt('commonmark', {
      html: false,
      linkify: true,
      breaks: true,
      typographer: true,
      highlight: (s: string) => this.highlight(s)
    });

    // this.md.use(taskLists, { enabled: true });
    this.md.renderer.rules['link_open'] = this.linkOpen.bind(this);
    this.div = document.createElement('div');
  }

  public render(text: string, trailingSpaces = ''): string {
    const lines = text.split('\n');
    const stack: string[] = [];
    const block = /^\s*```/gi;
    let inside = false;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      if (block.test(line)) {
        stack.push(line);
        inside = !inside;
        continue;
      }

      if (inside) {
        stack.push(line);
        continue;
      }

      if (line.match(/^\s\s/g)) {
        line = line.replace(/^\s\s/g, '\u00a12');
      }

      if (!line.length) {
        line += '\\';
      }

      stack.push(line + '\n');
    }

    return this.md.render(stack.join('\n'))
      .replace(/<p>\\<\/p>/g, `<p><span>${trailingSpaces}</span></p>`)
      .replace(/\u00a12/g, '  ');
  }

  public unescapeAll(text: string): string {
    return this.md.utils.unescapeAll(text);
  }

  public toString(text: string): string {
    this.div.innerHTML = this.render(text);

    return this.div.innerText;
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

  private highlight(text: string) {
    return '<pre><code class="test-w">' + this.md.utils.escapeHtml(text.replace(/\n$/gi, '')) + '</code></pre>';
  }
}

export const mdRender = new MarkdownRender();
