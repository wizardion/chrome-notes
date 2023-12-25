import {
  inputRules, wrappingInputRule,
  emDash, ellipsis, textblockTypeInputRule, InputRule
} from 'prosemirror-inputrules';
import { NodeType, MarkType, Schema, Attrs } from 'prosemirror-model';


function markInputRule(regexp: RegExp, markType: MarkType, attrs?: Attrs) {
  return new InputRule(regexp, (state, match, start, end) => {
    const transaction = state.tr;

    if (match[1]) {
      const textStart = start + match[0].indexOf(match[1]);
      const textEnd = textStart + match[1].length;

      if (textEnd < end) {
        transaction.delete(textEnd, end);
      }

      if (textStart > start) {
        transaction.delete(start, textStart);
      }

      end = start + match[1].length;

      return transaction.addMark(start, end, markType.create(attrs));
    }

    return null;
  });
}


/* taken from `prosemirror-example-setup/src/inputrules.ts` */
export function orderedListRule(nodeType: NodeType) {
  return wrappingInputRule(/^(\d+)\.\s$/, nodeType, match => ({ order: +match[1] }),
    (match, node) => node.childCount + node.attrs.order === +match[1]);
}

/* taken from `prosemirror-example-setup/src/inputrules.ts` */
export function bulletListRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}

/* taken from `prosemirror-example-setup/src/inputrules.ts` */
export function headingRule(nodeType: NodeType) {
  const re = new RegExp('^(#{1,6})\\s$');

  return textblockTypeInputRule(re, nodeType, match => ({ level: match[1].length }));
}

export function codeBlockRule(nodeType: NodeType) {
  return textblockTypeInputRule(/^```$/, nodeType);
}

export function markEm(mark: MarkType) {
  return markInputRule(/_(\w+)_\s$/, mark);
}

// export const quotes = new InputRule(/'\w+$/, '\'\'');

/* taken from `prosemirror-example-setup/src/inputrules.ts` */
export function buildInputRules(schema: Schema) {
  const rules = [].concat(ellipsis, emDash);

  if (schema.nodes.bulletList) {
    const item = schema.nodes.bulletList;

    rules.push(bulletListRule(item));
  }

  if (schema.nodes.orderedList) {
    const item = schema.nodes.orderedList;

    rules.push(orderedListRule(item));
  }

  if (schema.nodes.heading) {
    const item = schema.nodes.heading;

    rules.push(headingRule(item));
  }

  if (schema.marks.italic) {
    const item = schema.marks.italic;

    rules.push(markEm(item));
  }

  return inputRules({ rules });
}
