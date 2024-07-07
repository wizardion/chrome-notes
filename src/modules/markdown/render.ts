import MarkdownIt from 'markdown-it';


export class MarkdownMDRender {
  private static md = new MarkdownIt('commonmark', { html: false, linkify: true, breaks: false });

  public static render(text: string): string {
    return text;
  }

  public static parse(text: string) {
    const tokens = this.md.parse(text, {});

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      console.log(token);
    }
  }
}
