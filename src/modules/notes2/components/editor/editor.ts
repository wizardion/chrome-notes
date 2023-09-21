import {Compartment, EditorState} from '@codemirror/state';
import {EditorView, drawSelection, highlightSpecialChars, keymap} from '@codemirror/view';
import {history} from '@codemirror/commands';
import {markdown, markdownLanguage} from '@codemirror/lang-markdown';
import { foldGutter, syntaxHighlighting } from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { markFolding } from './extensions/folding-icon';
import { markdownHighlighting } from './extensions/syntax-highlighting';
import { EditorBase } from 'modules/notes/editor';
import { Extension } from './extensions/extension.model';
import { editorFromTextArea } from './extensions/from-text-area';
import { 
  editorKeymap, markBold, markStrike, markItalic, insertLink, undo, redo 
} from './extensions/markdown-keymap';


export class Editor extends EditorBase {
  view: EditorView;
  extensions: Extension[];

  private actions: {[action: string]: EventListener} = {
    'bold':                 () => markBold(this.view),
    'strikethrough':        () => markStrike(this.view),
    'italic':               () => markItalic(this.view),
    // 'insertOrderedList':    () => this.command(this.insertList, '1. '),
    // 'insertUnorderedList':  () => this.command(this.insertList, '- '),
    // 'removeFormat':         () => this.command(this.removeFormat),
    'link':                 () => insertLink(this.view),
    'undo':                 () => undo(this.view),
    'redo':                 () => redo(this.view),
  };

  constructor(textarea: HTMLTextAreaElement, controls?: NodeList, value?: string) {
    super();
    
    this.extensions = [
      foldGutter({ markerDOM: markFolding }),
      highlightSpecialChars(),
      history({ minDepth: 15 }),
      
      syntaxHighlighting(markdownHighlighting, { fallback: true }),
      markdown({base: markdownLanguage, codeLanguages: languages}),
      drawSelection(),

      new Compartment().of(EditorState.tabSize.of(2)),
      keymap.of([].concat(editorKeymap)),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ spellcheck: 'true' }),
    ];

    this.view = editorFromTextArea(value, textarea, this.extensions);
    this.initControls(controls);
  }

  private initControls(controls: NodeList) {
    controls.forEach((item: HTMLElement) => {
      const action = item.getAttribute('action');
      const event = this.actions[action];

      if (event) {
        item.onclick = event;
        item.onmousedown = (e: MouseEvent) => e.preventDefault();
      }
    });
  }

  get value(): string {
    return this.view.state.doc.toString();
  }

  set value(text: string) {
    this.view.setState(EditorState.create({doc: text, extensions: this.extensions}));
  }

  getData(text?: string) {
    const value = text || this.view.state.doc.toString();
    const data: string[] = (value || '').split(/^([^\n]*)\r?\n/).filter((w, i) => i < 1 && w || i);
    const title: string = (data && data.length) ? data[0].trim() : '';
    const description: string = (data && data.length > 1) ? data[1] : '';

    return [title, description];
  }

  focus() {
    this.view.focus();
  }
}
