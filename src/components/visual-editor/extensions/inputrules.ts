import {
  inputRules, wrappingInputRule,
  emDash, ellipsis, textblockTypeInputRule, InputRule
} from 'prosemirror-inputrules';
import { NodeType, MarkType, Schema, Attrs } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';


export interface IMatchGroup {
  value: string;
  attrs?: Attrs | null;
}

function markInputRule(regexp: RegExp, markType: MarkType, matcher?: (match: RegExpMatchArray) => IMatchGroup) {
  return new InputRule(regexp, (state: EditorState, match: RegExpMatchArray, start: number, end: number) => {
    const group: IMatchGroup = { value: match[1], attrs: null };

    if (matcher) {
      const { attrs, value } = matcher(match);

      group.attrs = attrs;
      group.value = value;
    }

    if (group.value) {
      const transaction = state.tr;
      const textStart = start + match[0].indexOf(group.value);
      const textEnd = textStart + group.value.length;

      if (textEnd < end) {
        transaction.delete(textEnd, end);
      }

      if (textStart > start) {
        transaction.delete(start, textStart);
      }

      end = start + group.value.length;

      return transaction.addMark(start, end, markType.create(group.attrs));
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

export function blockquote(nodeType: NodeType) {
  return textblockTypeInputRule(/^>\s$/, nodeType);
}

export function markEm(mark: MarkType) {
  return markInputRule(/_(\w+)_\s|\*(\w+)\*\s$/, mark, m => ({ value: m[1] || m[2] }));
}

export function markStrong(mark: MarkType) {
  return markInputRule(/\*\*(\w+)\*\*\s$/, mark);
}

export function markStrike(mark: MarkType) {
  return markInputRule(/~~(\w+)~~\s$/, mark);
}

export function markLink(mark: MarkType) {
  return markInputRule(/\[(?<text>.*)\]\((?<url>.+)\)\s/g, mark, m => (
    { attrs: { href: m.groups.url }, value: m.groups.text }
  ));
}

export function markCode(mark: MarkType) {
  return markInputRule(/`(\s?\w+\s?)`\s$/, mark);
}

/* taken from `prosemirror-example-setup/src/inputrules.ts` */
export function buildInputRules(schema: Schema) {
  const rules = [
    ellipsis,
    emDash,
    bulletListRule(schema.nodes.bulletList),
    orderedListRule(schema.nodes.orderedList),
    headingRule(schema.nodes.heading),
    codeBlockRule(schema.nodes.codeBlock),
    blockquote(schema.nodes.blockquote),

    markStrong(schema.marks.strong),
    markStrike(schema.marks.strike),
    markEm(schema.marks.italic),
    markLink(schema.marks.link),
    markCode(schema.marks.code)
  ];

  return inputRules({ rules });
}
