import {
  inputRules, wrappingInputRule,
  emDash, ellipsis, textblockTypeInputRule
} from 'prosemirror-inputrules';
import { NodeType, Schema } from 'prosemirror-model';


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

  return inputRules({ rules });
}
