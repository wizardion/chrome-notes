import './assets/preview.scss';
import './assets/codemirror.scss';

import { Compartment, EditorState, SelectionRange } from '@codemirror/state';
import { EditorView, ViewUpdate, drawSelection, highlightSpecialChars, keymap } from '@codemirror/view';
import { history } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting } from '@codemirror/language';
import { languages } from '@codemirror/language-data';

import { mdRender } from 'modules/markdown/md-render';
import { CUSTOM_EVENTS, IExtension, INTERVALS } from 'components/models/extensions.model';
import { IEditorData, IEditorView } from 'components/models/editor.models';

import { markdownHighlighting } from './extensions/syntax-highlighting';
import { editorFromTextArea } from './extensions/from-text-area';
import { CODE_ACTIONS, editorKeymap } from './extensions/keymap';


export class MarkdownEditor implements IEditorView {
  locked: boolean;
  view: EditorView;
  range: SelectionRange;

  private extensions: IExtension[];
  private _hidden: boolean;

  constructor(element: HTMLElement, controls?: NodeList) {
    this.extensions = [
      highlightSpecialChars(),
      history({ minDepth: 15 }),

      syntaxHighlighting(markdownHighlighting, { fallback: true }),
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      drawSelection(),

      new Compartment().of(EditorState.tabSize.of(2)),
      keymap.of([].concat(editorKeymap)),
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ spellcheck: 'true' }),
      EditorView.updateListener.of((v: ViewUpdate) => this.updateListener(v))
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
    let title: string = null;

    if ((/^[#]+\s+/g).test(value)) {
      const data: string[] = value.split(/^([^\n]*)\r?\n/).filter((w, i) => i < 1 && w || i);

      title = (data && data.length) ? data[0] : '';
    } else {
      title = value && value.split(' ').splice(0, 6).join(' ') + ' ...';
    }

    return { title: title, description: value, selection: this.getSelection() };
  }

  setData(data: IEditorData) {
    this.locked = true;
    this.view.setState(EditorState.create({ doc: data.description, extensions: this.extensions }));

    if (data.selection) {
      this.setSelection(data.selection);
    }

    clearInterval(INTERVALS.locked);
    this.range = this.view.state.selection.main;
    INTERVALS.locked = setTimeout(() => this.locked = false, 300);
  }

  focus() {
    this.view.focus();
  }

  render() {
    const html = mdRender.render(this.view.state.doc.toString(), '&nbsp;');

    return `<div>${html}</div>`;
  }

  setSelection(selection: number[]) {
    const [from, to] = selection;

    this.view.focus();
    this.view.dispatch({
      selection: { anchor: from, head: to },
      effects: EditorView.scrollIntoView(from, { y: 'center' })
    });
  }

  addEventListener(type: 'change' | 'save', listener: EventListener): void {
    if (type === 'change') {
      CUSTOM_EVENTS.change = listener;
    }

    if (type === 'save') {
      CUSTOM_EVENTS.save = (e: Event) => this.saveEventHandler(e, listener);
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

  private saveEventHandler(e: Event, listener: EventListener) {
    clearInterval(INTERVALS.changed);
    listener(e);
  }

  private changeEventHandler() {
    this.range = this.view.state.selection.main;
    CUSTOM_EVENTS.change(new Event('change'));
  }

  private updateListener(view: ViewUpdate) {
    if (!this.locked && CUSTOM_EVENTS.change && this.isDocChanged(view)) {
      clearInterval(INTERVALS.changed);
      INTERVALS.changed = setTimeout(() => this.changeEventHandler(), 800);
    }
  }
}
