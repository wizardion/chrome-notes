import './assets/preview.scss';
import './assets/codemirror.scss';

import { Compartment, EditorState, SelectionRange } from '@codemirror/state';
import { EditorView, ViewUpdate, drawSelection, highlightSpecialChars, keymap } from '@codemirror/view';
import { history } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting } from '@codemirror/language';
import { languages } from '@codemirror/language-data';

import { MarkdownRender } from 'modules/markdown';
import { IExtension } from 'components/models/extensions.model';
import { IEditorData, IEditorView } from 'components/models/editor.models';

import { markdownHighlighting } from './extensions/syntax-highlighting';
import { editorFromTextArea } from './extensions/from-text-area';
import { CODE_ACTIONS, editorKeymap } from './extensions/keymap';
import { IEventListener } from 'core/components';


const mdRender = new MarkdownRender({ renderSpaces: true });

export class MarkdownEditor implements IEditorView {
  view: EditorView;
  range: SelectionRange;

  private extensions: IExtension[];
  private _hidden: boolean;
  private listeners = new Map<'change' | 'save', IEventListener>();

  constructor(element: HTMLElement, controls?: NodeList) {
    this.extensions = [
      highlightSpecialChars(),
      history({ minDepth: 15 }),

      syntaxHighlighting(markdownHighlighting, { fallback: true }),
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      drawSelection(),

      new Compartment().of(EditorState.tabSize.of(2)),
      keymap.of([].concat(editorKeymap, {
        key: 'Mod-s',
        preventDefault: true,
        run: () => this.saveEventHandler(),
      })),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ spellcheck: 'true' }),
      EditorView.updateListener.of((v: ViewUpdate) => this.updateEventHandler(v))
    ];

    this.view = editorFromTextArea('', <HTMLTextAreaElement>element, this.extensions);
    this.initControls(controls);
  }

  get element(): HTMLElement {
    return this.view.scrollDOM;
  }

  get hidden(): boolean {
    if (this._hidden === null) {
      this._hidden = this.view.dom.hidden;
    }

    return this._hidden;
  }

  set hidden(value: boolean) {
    if (this._hidden !== value) {
      this._hidden = value;
      this.view.dom.hidden = value;
    }
  }

  get scrollTop(): number {
    return this.view.scrollDOM.scrollTop;
  }

  set scrollTop(value: number) {
    this.view.scrollDOM.scrollTop = value;
  }

  getData(): IEditorData {
    const value = this.view.state.doc.toString() || '';

    return { title: this.getTitle(value), description: value, selection: this.getSelection() };
  }

  setData(data: IEditorData) {
    this.view.setState(EditorState.create({ doc: data.description, extensions: this.extensions }));

    if (data.selection) {
      this.setSelection(data.selection);
    }

    this.range = this.view.state.selection.main;
  }

  focus() {
    this.view.focus();
  }

  render() {
    const html = mdRender.render(this.view.state.doc.toString());

    return `<div>${html}</div>`;
  }

  setSelection(selection: number[]) {
    const [from, to] = selection;

    this.view.focus();

    try {
      this.view.dispatch({
        selection: { anchor: from, head: to },
        effects: EditorView.scrollIntoView(from, { y: 'center' })
      });
    } catch (e) {
      this.view.dispatch({
        selection: { anchor: 0, head: 0 },
        effects: EditorView.scrollIntoView(from, { y: 'center' })
      });
    }
  }

  addEventListener(type: 'change' | 'save', listener: IEventListener): void {
    if (type === 'change' && !this.listeners.has('change')) {
      this.listeners.set(type, listener);
    }

    if (type === 'save' && !this.listeners.has('save')) {
      this.listeners.set(type, listener);
    }
  }

  private initControls(controls: NodeList) {
    controls.forEach((item: HTMLElement) => {
      const action = item.getAttribute('action');
      const event = CODE_ACTIONS[action];

      if (event) {
        item.onmousedown = (e) => {
          e.preventDefault();
          event(this.view);
        };
        // item.onmousedown = (e: MouseEvent) => e.preventDefault();
      }
    });
  }

  private getSelection(): number[] {
    const range = this.view.state.selection.main;

    return [range.from, range.to];
  }

  private isDocChanged(view: ViewUpdate): boolean {
    const range = this.view.state.selection.main;

    return view.docChanged || (view.selectionSet && (range.from !== this.range.from || range.to !== this.range.to));
  }

  private saveEventHandler() {
    const handler = this.listeners.get('save');

    if (handler) {
      handler(new Event('save'));
    }
  }

  private updateEventHandler(view: ViewUpdate) {
    const handler = this.listeners.get('change');

    if (handler && this.isDocChanged(view)) {
      handler(new Event('change'));
    }
  }

  private getTitle(value: string): string {
    const first = value.split('\n').find(i => i.trim().length > 0);

    return first ? mdRender.toString(first).trim().split(' ').slice(0, 10).join(' ') : '';
  }
}
