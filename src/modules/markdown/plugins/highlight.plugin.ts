import MarkdownIt from 'markdown-it';


export function highlight(text: string, utils: MarkdownIt.Utils) {
  return '<pre><code class="test-w">' + utils.escapeHtml(text.replace(/\n$/gi, '')) + '</code></pre>';
}

export function codeHighlight(md: MarkdownIt): void {
  md.options.highlight = (text: string) => highlight(text, md.utils);
}


