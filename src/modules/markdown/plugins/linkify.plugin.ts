import MarkdownIt, { Renderer } from 'markdown-it';
import Token from 'markdown-it/lib/token.mjs';


function linkOpen(tokens: Token[], id: number, options: MarkdownIt.Options, env: object, self: Renderer) {
  const aIndex = tokens[id].attrIndex('target');

  if (aIndex < 0) {
    tokens[id].attrPush(['target', '_blank']);
  } else {
    tokens[id].attrs[aIndex][1] = '_blank';
  }

  return self.renderToken(tokens, id, options);
}

export function linkify(md: MarkdownIt): void {
  md.renderer.rules.link_open = linkOpen;
}
