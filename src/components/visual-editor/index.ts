
import './assets/editor.view.scss';
import './assets/virtual-cursor.scss';
import './assets/tooltip.scss';

import { EditorView } from 'prosemirror-view';
import { EditorState, Plugin, TextSelection } from 'prosemirror-state';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { history } from 'prosemirror-history';
import { DOMParser } from 'prosemirror-model';
import { gapCursor } from 'prosemirror-gapcursor';
import { dropCursor } from 'prosemirror-dropcursor';

import { IEditorData, IEditorView } from 'components/models/editor.models';
import { mdRender } from 'modules/markdown';

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
  private html: HTMLPreElement;
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
      clipboard(),
      cursorLink(),
      trackerChanges(() => this.updateEventHandler())
    ];

    this.view = new EditorView(this.content, { state: EditorState.create({ schema: schema }) });
    this.html = <HTMLPreElement>document.createElement('pre');
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
    const text = TextSerializer.serialize(this.view.state) || '';
    const value = MarkdownSerializer.serialize(this.view.state);
    const shorten = ((/\n/g).test(text) ? text.split(/\n/g).shift() : text).split(' ').splice(0, 6).join(' ');
    const title = mdRender.toString(shorten).replace(/\n/g, '');
    const { anchor, head } = this.view.state.selection.toJSON();

    return { title: title, description: value, selection: [anchor, head] };
  }

  setData(data: IEditorData) {
    this.html.innerHTML = mdRender.render(data.description);

    this.view.updateState(
      EditorState.create({
        schema: schema,
        doc: DOMParser.fromSchema(schema).parse(this.html),
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
      console.log('set selection error', error);
      this.setSelection([0, 0]);
    }
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

  private updateEventHandler() {
    const handler = this.listeners.get('change');

    if (handler) {
      handler(new Event('change'));
    }
  }
}
