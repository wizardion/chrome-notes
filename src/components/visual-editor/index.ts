
import './assets/editor.view.scss';
import './assets/virtual-cursor.scss';
import './assets/tooltip.scss';

import { EditorView } from 'prosemirror-view';
import { EditorState, Plugin, TextSelection } from 'prosemirror-state';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { history } from 'prosemirror-history';
import { DOMParser as EditorDOMParser } from 'prosemirror-model';
import { gapCursor } from 'prosemirror-gapcursor';
import { dropCursor } from 'prosemirror-dropcursor';

import { IEditorData, IEditorView } from 'components/models/editor.models';

import { menu } from './extensions/menu';
import { schema } from './extensions/schema';
import { buildKeymap } from './extensions/keymap';
import { virtualCursor } from './extensions/cursor';
import { buildInputRules } from './extensions/inputrules';
import { MarkdownSerializer } from './extensions/serializer/serializer';
import { clipboard } from './extensions/clipboard';
import { cursorLink } from './extensions/cursor-link';
import { IEventListener } from 'core/components';
import { trackerChanges } from './extensions/changes';
import { TextSerializer } from './extensions/serializer/text-serializer';


export class VisualEditor implements IEditorView {
  view: EditorView;

  private plugins: Plugin[];
  private parser: DOMParser;
  private content: HTMLElement;
  private listeners = new Map<'change' | 'save', IEventListener>();

  constructor(element: HTMLElement, controls?: NodeList) {
    const saveHandler = () => this.saveEventHandler();

    this.content = element;
    this.content.id = 'editor';
    this.content.classList.add('visual-editor');

    this.plugins = [
      menu(controls),
      buildInputRules(schema),
      keymap(buildKeymap(schema, { 'Mod-s': saveHandler, 'Mod-S': saveHandler })),
      keymap(baseKeymap),
      dropCursor({ color: 'gray', width: 1 }),
      gapCursor(),
      history(),
      virtualCursor(),
      clipboard(schema),
      cursorLink(),
      trackerChanges((e) => this.updateEventHandler(e))
    ];

    this.view = new EditorView(this.content, { state: EditorState.create({ schema: schema }) });
    this.parser = new DOMParser();
  }

  get element(): HTMLElement {
    return this.content;
  }

  get hidden(): boolean {
    return this.view.dom.hidden;
  }

  set hidden(value: boolean) {
    this.view.dom.hidden = value;
  }

  get scrollTop(): number {
    return this.view.dom.scrollTop;
  }

  set scrollTop(value: number) {
    this.view.dom.scrollTop = value;
  }

  getData(): IEditorData {
    const text = TextSerializer.serializeInline(this.view.state.doc.content) || '';
    const value = MarkdownSerializer.serialize(this.view.state.doc.content);

    return { title: this.getTitle(text), description: value, selection: this.getSelection() };
  }

  setData(data: IEditorData) {
    const dom = this.parser.parseFromString(MarkdownSerializer.md.render(data.description), 'text/html');

    this.view.updateState(
      EditorState.create({
        schema: schema,
        doc: EditorDOMParser.fromSchema(schema).parse(dom),
        plugins: this.plugins,
        storedMarks: this.view.state.storedMarks
      })
    );

    this.view.focus();
    this.setSelection(data.selection);
  }

  focus() {
    this.view.focus();
  }

  render() {
    return `<div>html</div>`;
  }

  setSelection(selection: number[]) {
    const [from, to] = selection;

    try {
      const position = this.view.state.doc.resolve(from);

      if (position?.parent.inlineContent) {
        const transaction = this.view.state.tr;

        transaction.doc.resolve(from).parent.inlineContent;
        transaction.setSelection(TextSelection.create(transaction.doc, from, to));
        transaction.scrollIntoView();
        this.view.dispatch(transaction);
      }
    } catch (error) {
      this.setSelection([0, 0]);
    }
  }

  getSelection(): number[] {
    const { anchor, head } = this.view.state.selection.toJSON();

    return [anchor, head];
  }

  addEventListener(type: 'change' | 'save', listener: EventListener): void {
    if (type === 'change' && !this.listeners.has('change')) {
      this.listeners.set(type, listener);
    }

    if (type === 'save' && !this.listeners.has('save')) {
      this.listeners.set(type, listener);
    }
  }

  private saveEventHandler(): boolean {
    const handler = this.listeners.get('save');

    if (handler) {
      handler(new Event('save'));
    }

    return true;
  }

  private updateEventHandler(e: Event) {
    const handler = this.listeners.get('change');

    if (handler) {
      handler(e);
    }
  }

  private getTitle(value: string): string {
    return value ? value.trim().split(' ').slice(0, 10).join(' ') : '';
  }
}
