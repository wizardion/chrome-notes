import { Schema } from 'prosemirror-model';


export const schema = new Schema({
  nodes: {
    text: {
      group: 'inline',
    },
    heading: {
      attrs: { level: { default: 1 } },
      content: 'inline*',
      group: 'block',
      defining: true,
      parseDOM: [{ tag: 'h1', attrs: { level: 1 } },
        { tag: 'h2', attrs: { level: 2 } },
        { tag: 'h3', attrs: { level: 3 } },
        { tag: 'h4', attrs: { level: 4 } },
        { tag: 'h5', attrs: { level: 5 } },
        { tag: 'h6', attrs: { level: 6 } }],
      toDOM(node) { return ['h' + node.attrs.level, 0]; }
    },
    star: {
      inline: true,
      group: 'inline',
      toDOM() { return ['star', '🟊']; },
      parseDOM: [{ tag: 'star' }]
    },
    paragraph: {
      group: 'block',
      content: 'inline*',
      toDOM() { return ['p', 0]; },
      parseDOM: [{ tag: 'p' }]
    },
    boring_paragraph: {
      group: 'block',
      content: 'text*',
      marks: '',
      toDOM() { return ['p', { class: 'boring' }, 0]; },
      parseDOM: [{ tag: 'p.boring', priority: 60 }]
    },
    doc: {
      content: 'block+'
    }
  },
  marks: {
    shouting: {
      toDOM() { return ['shouting', 0]; },
      parseDOM: [{ tag: 'shouting' }]
    },
    link: {
      attrs: { href: {} },
      toDOM(node) { return ['a', { href: node.attrs.href }, 0]; },
      parseDOM: [{ tag: 'a', getAttrs: (dom: HTMLLinkElement) => { return { href: dom.href }; } }],
      inclusive: false
    }
  }
});
