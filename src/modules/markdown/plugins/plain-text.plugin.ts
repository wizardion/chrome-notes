import Token from 'markdown-it/lib/token.mjs';


function parseTokens(tokens: Token[]): string[] {
  let lines: string[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.children) {
      lines = lines.concat(parseTokens(token.children));
      continue;
    }

    if (!token.hidden && !token.tag) {
      lines = lines.concat(token.content);
    }
  }

  return lines;
}

export function renderInlinePlainText(tokens: Token[]): string {
  const content = parseTokens(tokens);

  return content.join('');
}
