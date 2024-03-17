import { Schema } from 'prosemirror-model';


export const schema = new Schema({
  nodes: {
    doc: {
      content: 'block+'
    },
    paragraph: {
      group: 'block',
      content: 'inline*',
      toDOM: () => ['p', 0],
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
      toDOM: (node) => ['h' + node.attrs.level, 0]
    },
    text: {
      group: 'inline',
    },
    // https://tiptap.dev/docs/editor/api/nodes/task-list
    // checkList: {
    //   content: 'listItem+',
    //   group: 'block',
    //   attrs: { 'class': { default: 'contains-task-list' } },
    //   parseDOM: [{ tag: 'ul[class="contains-task-list"]' }],
    //   toDOM: (node) => ['ul', { class: node.attrs.class }, 0]
    // },
    bulletList: {
      content: 'listItem+',
      group: 'block',
      parseDOM: [{ tag: 'ul' }],
      toDOM: () => ['ul', 0]
    },
    orderedList: {
      content: 'listItem+',
      group: 'block',
      parseDOM: [{ tag: 'ol' }],
      toDOM: () => ['ol', 0]
    },
    listItem: {
      content: 'paragraph block*',
      defining: true,
      parseDOM: [{ tag: 'li' }],
      toDOM: () => ['li', 0]
    },
    // listItemCheck: {
    //   content: 'paragraph block*',
    //   defining: true,
    //   parseDOM: [{ tag: 'li' }],
    //   toDOM: () => ['li', 0]
    // },
    codeBlock: {
      content: 'text*',
      marks: '',
      group: 'block',
      code: true,
      defining: true,
      parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
      toDOM: () => ['pre', ['code', 0]]
    },
    blockquote: {
      content: 'text*',
      group: 'block',
      defining: true,
      parseDOM: [{ tag: 'blockquote' }],
      toDOM: () => ['blockquote', 0]
    },
    // checkbox: {
    //   defining: true,
    //   inline: true,
    //   group: 'inline',
    //   attrs: { 'checked': { default: false } },
    //   parseDOM: [{ tag: 'input[type=checkbox]' }],
    //   // toDOM: (node) => ['input', { type: 'checkbox', checked: node.attrs.checked }, 0],
    //   toDOM: (node) => {
    //     const attrs: Record<string, string> = { type: 'checkbox' };

    //     console.log('node.attrs', node.attrs);

    //     if (node.attrs.checked) {
    //       attrs.checked = 'checked';
    //     }

    //     return ['input', attrs];
    //   },
    // }
    // break: {
    //   inline: true,
    //   group: 'inline',
    //   selectable: false,
    //   parseDOM: [{ tag: 'br' }],
    //   leafText: () => '\n',
    //   toDOM: () => ['br']
    // }
  },
  marks: {
    link: {
      attrs: { href: {} },
      toDOM: (node) => ['a', { href: node.attrs.href }, 0],
      parseDOM: [{ tag: 'a', getAttrs: (dom: HTMLLinkElement) => ({ href: dom.href }) }]
    },
    code: {
      toDOM: () => ['code', 0],
      parseDOM: [{ tag: 'code' }]
    },
    strong: {
      toDOM: () => ['strong', 0],
      parseDOM: [{ tag: 'strong' }]
    },
    italic: {
      toDOM: () => ['em', 0],
      parseDOM: [{ tag: 'em' }]
    },
    strike: {
      toDOM: () => ['del', 0],
      parseDOM: [{ tag: 'del' }]
    }
  }
});
