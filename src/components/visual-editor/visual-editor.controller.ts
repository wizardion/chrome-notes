
import './assets/editor.view.scss';
import './assets/virtual-cursor.scss';

import { EditorView } from 'prosemirror-view';
import { EditorState, Plugin, TextSelection } from 'prosemirror-state';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { history } from 'prosemirror-history';
import { DOMParser } from 'prosemirror-model';
import { gapCursor } from 'prosemirror-gapcursor';
import { dropCursor } from 'prosemirror-dropcursor';

import { IEditorData, IEditorView } from 'components/models/editor.models';
import { CUSTOM_EVENTS, INTERVALS } from 'components/models/extensions.model';
import { mdRender } from 'modules/markdown';

import { menu } from './extensions/menu';
import { schema } from './extensions/schema';
import { buildKeymap } from './extensions/keymap';
import { virtualCursor } from './extensions/cursor';
import { buildInputRules } from './extensions/inputrules';
import { MarkdownSerializer } from './extensions/serializer/serializer';


export class VisualEditor implements IEditorView {
  view: EditorView;

  private locked: boolean;
  private plugins: Plugin[];

  private html: HTMLElement;
  private content: HTMLElement;

  constructor(element: HTMLElement, controls?: NodeList) {
    this.content = <HTMLElement> document.createElement('div');

    this.content.id = 'editor';
    this.content.classList.add('visual-editor');

    this.plugins = [
      menu(controls),
      buildInputRules(schema),
      keymap(buildKeymap(schema)),
      keymap(baseKeymap),
      dropCursor({ color: 'gray', width: 1 }),
      gapCursor(),
      history(),
      virtualCursor()
    ];

    this.view = new EditorView(this.content, { state: EditorState.create({ schema: schema }) });

    // this.initControls(controls);
    this.html = <HTMLElement> document.createElement('div');
    element.parentElement.insertBefore(this.content, element.nextSibling);
  }

  /** @deprecated Use `getData` instead. */
  get value(): string {
    // return markdownSerializer.serialize(this.view.state.doc);
    return '';
  }

  /** @deprecated Use `setData` instead. */
  set value(text: string) {
    // this.view.updateState(
    //   EditorState.create({ doc: markdownParser.parse(text), plugins: this.plugins })
    // );
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
    const value = MarkdownSerializer.serialize(this.view.state);
    const { anchor, head } = this.view.state.selection.toJSON();
    let title: string = null;

    if ((/^[#]+\s+/g).test(value)) {
      const data: string[] = value.split(/^([^\n]*)\r?\n/).filter((w, i) => i < 1 && w || i);

      title = (data && data.length) ? data[0] : '';
    } else {
      title = value && value.split(' ').splice(0, 6).join(' ') + ' ...';
    }

    return { title: title, description: value, selection: [anchor, head] };
  }

  setData(data: IEditorData) {
    this.locked = true;
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

    clearInterval(INTERVALS.locked);
    // this.range = this.view.state.selection.main;
    INTERVALS.locked = setTimeout(() => this.locked = false, 300);
  }

  focus() {
    this.view.focus();
  }

  render() {
    return `<div>html</div>`;
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
    console.log('initControls', controls);
    // controls.forEach((item: HTMLElement) => {
    //   const action = item.getAttribute('action');
    //   const event = CODE_ACTIONS[action];

    //   if (event) {
    //     item.onclick = () => event(this.view);
    //     item.onmousedown = (e: MouseEvent) => e.preventDefault();
    //   }
    // });
  }

  private setSelection(selection: number[]) {
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
    }
  }

  // private getSelection(): number[] {
  //   const range = this.view.state.selection.main;

  //   return [range.from, range.to];
  // }

  // private isDocChanged(view: ViewUpdate): boolean {
  //   const range = this.view.state.selection.main;

  //   return view.docChanged || (view.selectionSet && (range.from !== this.range.from || range.to !== this.range.to));
  // }

  private saveEventHandler(e: Event, listener: EventListener) {
    clearInterval(INTERVALS.changed);
    listener(e);
  }

  // private changeEventHandler() {
  //   this.range = this.view.state.selection.main;
  //   CUSTOM_EVENTS.change(new Event('change'));
  // }

  // private updateListener(view: ViewUpdate) {
  //   if (!this.locked && CUSTOM_EVENTS.change && this.isDocChanged(view)) {
  //     clearInterval(INTERVALS.changed);
  //     INTERVALS.changed = setTimeout(() => this.changeEventHandler(), 800);
  //   }
  // }
}
