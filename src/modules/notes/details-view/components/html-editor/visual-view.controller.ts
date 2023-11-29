
// import './assets/styles.scss';
import './assets/preview.scss';
import './assets/editor.scss';

import { EditorView } from 'prosemirror-view';
import { EditorState, Plugin, TextSelection } from 'prosemirror-state';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { history } from 'prosemirror-history';
import { IEditorData, IEditorView } from '../models/editor.models';
import { CUSTOM_EVENTS, INTERVALS } from '../editor/extensions/editor-commands';
// import { CODE_ACTIONS, editKeymap } from './extensions/editor-keymap';
// import { markdownParser } from './extensions/helpers/markdown.parser';
import { markdownSerializer } from './extensions/testing/helpers/markdown-serializer';
// import { schema } from './extensions/helpers/schema';
import { menu } from './extensions/menu';
import { schema } from './extensions/schema';
import { DOMParser, DOMSerializer } from 'prosemirror-model';
// import * as model from 'prosemirror-model';
// import { mdRender } from '../editor/extensions/md-render';
import { defaultMarkdownParser, defaultMarkdownSerializer } from 'prosemirror-markdown';
import { markdownParser, md } from './extensions/markdown.parser';


export class VisualView implements IEditorView {
  view: EditorView;

  private locked: boolean;
  private plugins: Plugin[];

  private content: HTMLElement;

  constructor(element: HTMLElement, controls?: NodeList) {
    const content = <HTMLElement> document.createElement('div');

    content.id = 'editor';
    content.classList.add('content-preview');
    // this.plugins = [
    //   keymap(baseKeymap),
    //   keymap(editKeymap),
    //   history(),
    // ];

    // this.plugins = exampleSetup({ schema, menuBar: false });

    this.plugins = [
      menu(controls),
      keymap(baseKeymap),
      history(),
    ];

    this.view = new EditorView(content, { state: EditorState.create({ schema: schema }) });

    // this.initControls(controls);
    element.parentElement.insertBefore(content, element.nextSibling);
  }

  get value(): string {
    return markdownSerializer.serialize(this.view.state.doc);
  }

  /** @deprecated Use `setData` instead. */
  set value(text: string) {
    // this.view.updateState(
    //   EditorState.create({ doc: markdownParser.parse(text), plugins: this.plugins })
    // );
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
    const value = defaultMarkdownSerializer.serialize(this.view.state.doc);
    const { anchor, head } = this.view.state.selection.toJSON();
    let title: string = null;

    if ((/^[#]+\s+/g).test(value)) {
      const data: string[] = value.split(/^([^\n]*)\r?\n/).filter((w, i) => i < 1 && w || i);

      title = (data && data.length) ? data[0] : '';
    } else {
      title = value && value.split(' ').splice(0, 6).join(' ') + ' ...';
    }

    return { title: title, description: value, selection: [anchor, head] };
    // return { title: 'title', description: 'value', selection: [0, 0] };
  }

  setData(data: IEditorData) {
    this.locked = true;

    // console.log('data', data.description);

    // const html = mdRender.render(data.description);
    // const tokens = mdRender.parse(data.description, {});
    // md.parse(data.description);

    const div = document.createElement('div');

    div.innerHTML = md.render(data.description);

    console.log('--- data.description ----------------------------------------------');
    console.log(data.description);

    console.log('--- div.innerHTML -------------------------------------------------');
    console.log(div.innerHTML);
    console.log('-------------------------------------------------------------------');
    const tokens = md.parse(data.description, null);

    console.log(tokens);
    console.log('-------------------------------------------------------------------');

    // const domParser = new DOMParser();

    // const dom = domParser.parseFromString(md.render(data.description), 'text/html');

    // console.log('dom', dom);


    // const json = DOMParser.fromSchema(schema).parse(`<p>Hello world</p>`, {
    //   preserveWhitespace: true
    // });

    // console.log('json', json);
    // DOMSerializer.fromSchema(schema).

    this.view.updateState(
      EditorState.create({
        schema: schema,
        // doc: markdownParser.parse(data.description),
        doc: DOMParser.fromSchema(schema).parse(div),
        // doc: model.DOMParser.fromSchema(schema).parse(dom),
        plugins: this.plugins,
        storedMarks: this.view.state.storedMarks
      })
    );

    console.log(this.view.dom.innerHTML);
    console.log('-------------------------------------------------------------------');

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
    const position = this.view.state.doc.resolve(from);

    if (position?.parent.inlineContent) {
      const transaction = this.view.state.tr;

      transaction.doc.resolve(from).parent.inlineContent;
      transaction.setSelection(TextSelection.create(transaction.doc, from, to));
      transaction.scrollIntoView();
      this.view.dispatch(transaction);
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
