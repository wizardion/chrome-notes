import MarkdownIt, { StateCore } from 'markdown-it';
import Token from 'markdown-it/lib/token.mjs';
import { IPluginOptions } from '../models/md.models';


function getTokens(line: number, count: number): Token[] {
  let tokens: Token[] = [];

  for (let i = 0; i < count; i++) {
    const open = new Token('empty_line_open', 'p', 1);
    const close = new Token('empty_line_close', 'p', -1);
    const inline = new Token('inline', '', 0);

    open.map = [line, line + 1];
    open.block = true;

    inline.children = [new Token('text', '', 0)];
    inline.content = '';
    inline.map = [line, line + 1];
    inline.level = 1;
    inline.block = true;

    close.block = true;

    tokens = tokens.concat([open, inline, close]);
  }

  return tokens;
}

function parseTokens(state: StateCore): boolean {
  const lines = state.src.split('\n');
  let stack: Token[] = [];
  let position = 0;
  let current = 0;

  for (let i = 0; i < state.tokens.length; i++) {
    const { map } = state.tokens[i];

    if (map) {
      const [open, close] = map;

      if (current < open) {
        stack = stack.concat(state.tokens.slice(position, i), getTokens(current, open - current));
        position = i;
      }

      current = close;
    }
  }

  state.tokens = stack.concat(state.tokens.slice(position), getTokens(current, lines.length - current));

  return true;
}

function renderEmptyLineOpen(tokens: Token[], id: number) {
  return `<${tokens[id].tag}>&nbsp;`;
}

export function emptyLines(md: MarkdownIt, options: IPluginOptions): void {
  md.core.ruler.push('preserveEmptyLines', parseTokens);

  if (options.renderSpaces) {
    md.renderer.rules.empty_line_open = renderEmptyLineOpen;
  }
}
