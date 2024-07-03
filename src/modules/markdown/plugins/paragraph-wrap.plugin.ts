import MarkdownIt, { StateCore } from 'markdown-it';
import Token from 'markdown-it/lib/token.mjs';


const paragraph = { inside: false };
const lineBreaks: Record<string, boolean> = {
  'softbreak': true,
  'hardbreak': true,
};


function parseTokens(tokens: Token[], level = 0): boolean {
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.type === 'paragraph_open') {
      paragraph.inside = true;
      continue;
    }

    if (token.children) {
      parseTokens(token.children, level + 1);
    }

    if (paragraph.inside && lineBreaks[token.type]) {
      token.type = 'paragraph_break';
      token.tag = 'p';
      token.block = true;
    }

    if (token.type === 'paragraph_close') {
      paragraph.inside = false;
    }
  }

  return true;
}

function paragraphOpen(tokens: Token[], id: number) {
  return `<${tokens[id].tag}>`;
}

function paragraphClose(tokens: Token[], id: number) {
  return `</${tokens[id].tag}>`;
}

function paragraphBreak(tokens: Token[], id: number) {
  return `</${tokens[id].tag}><${tokens[id].tag}>`;
}

export function paragraphWrapper(md: MarkdownIt): void {
  md.core.ruler.push('paragraphWrapper', (state: StateCore) => parseTokens(state.tokens));

  md.renderer.rules.paragraph_open = paragraphOpen;
  md.renderer.rules.paragraph_close = paragraphClose;
  md.renderer.rules.paragraph_break = paragraphBreak;
}
