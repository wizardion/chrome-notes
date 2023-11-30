import { Schema } from 'prosemirror-model';


export const schema = new Schema({
  nodes: {
    text: {
      group: 'inline',
    },
    paragraph: {
      group: 'block',
      content: 'inline*',
      toDOM() { return ['p', 0]; },
      parseDOM: [{ tag: 'p' }]
    },
    heading: {
      attrs: { level: { default: 2 } },
      content: '(text)*',
      group: 'block',
      defining: true,
      parseDOM: [
        { tag: 'h1', attrs: { level: 1 } },
        { tag: 'h2', attrs: { level: 2 } },
        { tag: 'h3', attrs: { level: 3 } },
        { tag: 'h4', attrs: { level: 4 } },
        { tag: 'h5', attrs: { level: 5 } },
        { tag: 'h6', attrs: { level: 6 } }
      ],
      toDOM(node) { return ['h' + node.attrs.level, 0]; }
    },
    star: {
      inline: true,
      group: 'inline',
      toDOM() { return ['star', '🟊']; },
      parseDOM: [{ tag: 'star' }]
    },
    break: {
      inline: true,
      group: 'inline',
      selectable: false,
      parseDOM: [{ tag: 'br' }],
      toDOM() { return ['br']; }
    },
    doc: {
      content: 'block+'
    }
  },
  marks: {
    strong: {
      toDOM() { return ['strong', 0]; },
      parseDOM: [{ tag: 'strong' }]
    },
    italic: {
      toDOM() { return ['em', 0]; },
      parseDOM: [{ tag: 'em' }]
    },
    strike: {
      toDOM() { return ['del', 0]; },
      parseDOM: [{ tag: 'del' }]
    },
    link: {
      attrs: { href: {} },
      toDOM(node) { return ['a', { href: node.attrs.href }, 0]; },
      parseDOM: [{ tag: 'a', getAttrs: (dom: HTMLLinkElement) => { return { href: dom.href }; } }],
      inclusive: false
    }
  }
});
