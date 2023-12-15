import { inputRules, wrappingInputRule, textblockTypeInputRule,
  smartQuotes, emDash, ellipsis } from 'prosemirror-inputrules';
import { NodeType, Schema } from 'prosemirror-model';

/// Given a list node type, returns an input rule that turns a bullet
/// (dash, plush, or asterisk) at the start of a textblock into a
/// bullet list.
export function bulletListRule(nodeType: NodeType) {
  return wrappingInputRule(/^\s*([-+*])\s$/, nodeType);
}

export function buildInputRules(schema: Schema) {
  let rules = smartQuotes.concat(ellipsis, emDash), type;

  if (type = schema.nodes.bullet_list) {
    rules.push(bulletListRule(type));
  }

  return inputRules({ rules });
}
