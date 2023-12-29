import { tags } from '@lezer/highlight';
import { HighlightStyle } from '@codemirror/language';


export const markdownHighlighting = HighlightStyle.define([
  { tag: tags.list, class: 'cm-list' },
  { tag: tags.heading1, class: 'cm-heading-1' },
  { tag: tags.heading2, class: 'cm-heading-2' },
  { tag: tags.heading3, class: 'cm-heading-3' },
  { tag: tags.heading4, class: 'cm-heading-4' },
  { tag: tags.heading5, class: 'cm-heading-5' },
  { tag: tags.heading6, class: 'cm-heading-6' },
  { tag: tags.quote, color: '#219', class: 'cm-quote' },
  { tag: tags.monospace, color: '#219', class: 'cm-monospace' },

  { tag: tags.meta, color: '#404740', class: 'cm-meta' },
  // { tag: tags.meta, color: '#404740', display: 'none' },
  { tag: tags.link, class: 'cm-link' },
  { tag: tags.url, textDecoration: 'underline', color: '#219', class: 'cm-url' },
  { tag: tags.heading, fontWeight: 'bold' },
  { tag: tags.emphasis, fontStyle: 'italic', class: 'cm-italic' },
  { tag: tags.strong, fontWeight: 'bold', class: 'cm-bold' },
  { tag: tags.strikethrough, textDecoration: 'line-through', class: 'cm-strikethrough' },
  { tag: tags.keyword, color: '#708' },
  { tag: [tags.atom, tags.bool, tags.contentSeparator, tags.labelName], color: '#219' },
  { tag: [tags.literal, tags.inserted], color: '#164' },
  { tag: [tags.string, tags.deleted], color: '#a11' },
  { tag: [tags.regexp, tags.escape, /*@__PURE__*/tags.special(tags.string)], color: '#e40' },
  { tag: /*@__PURE__*/tags.definition(tags.variableName), color: '#00f' },
  { tag: /*@__PURE__*/tags.definition(tags.number), color: '#00f' },
  { tag: /*@__PURE__*/tags.local(tags.variableName), color: '#30a' },
  { tag: [tags.typeName, tags.namespace], color: '#085' },
  { tag: tags.className, color: '#167' },
  { tag: [/*@__PURE__*/tags.special(tags.variableName), tags.macroName], color: '#256' },
  { tag: /*@__PURE__*/tags.definition(tags.propertyName), color: '#00c' },
  { tag: tags.comment, color: '#940' },
  { tag: tags.invalid, color: '#f00'  }
]);

// import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
// import { languages } from '@codemirror/language-data'
// import { EditorState } from '@codemirror/state'
// import { MarkdownConfig } from '@lezer/markdown';

// const customTags = {
//   headingMark: Tag.define(),
// };

// const MarkStylingExtension: MarkdownConfig = {
//   props: [
//     styleTags({
//       HeadingMark: customTags.headingMark,
//     }),
//   ],
// };

// const highlightStyle = HighlightStyle.define([
//  {
//     tag: customTags.headerMark,
//     color: 'blue',
//   },
//   {
//     tag: tags.heading1,
//     color: 'black',
//     fontSize: '1.75em',
//     fontWeight: '700',
//   },
// ]);

// const editorState = EditorState.create({
//   doc: options.doc,
//   selection: options.selection,
//   extensions: [
//     markdown({
//       base: markdownLanguage,
//       codeLanguages: languages,
//       extensions: [MarkStylingExtension],
//     }),
//    highlightStyle,
//   ],
// });
