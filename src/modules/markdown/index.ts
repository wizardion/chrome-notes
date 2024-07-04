import MarkdownIt from 'markdown-it';
import { emptyLines } from './plugins/empty-lines.plugin';
import { paragraphWrapper } from './plugins/paragraph-wrap.plugin';
import { linkify } from './plugins/linkify.plugin';
import { codeHighlight } from './plugins/highlight.plugin';
import { IPluginOptions } from './models/md.models';
import { renderInlinePlainText } from './plugins/plain-text.plugin';
// import taskLists from '@hedgedoc/markdown-it-task-lists';


export class MarkdownRender {
  private md: MarkdownIt;

  constructor(options?: IPluginOptions) {
    this.md = new MarkdownIt('commonmark', {
      html: false,
      linkify: true,
      breaks: true,
      typographer: false
    });

    this.md.enable(['strikethrough']);
    this.md.use(linkify, { enabled: true });
    // this.md.use(taskLists, { enabled: true });
    this.md.use(codeHighlight, { enabled: true });
    this.md.use(paragraphWrapper, { enabled: true });
    this.md.use(emptyLines, { enabled: true, renderSpaces: options?.renderSpaces });
  }

  public render(value: string): string {
    return this.md.render(value);
  }

  public unescapeAll(text: string): string {
    return this.md.utils.unescapeAll(text);
  }

  public escape(text: string): string {
    return this.md.utils.escapeRE(text);
  }

  public toString(text: string): string {
    return text.split('\n').map(i => renderInlinePlainText(this.md.parse(i, {}))).join('\n');
  }
}
