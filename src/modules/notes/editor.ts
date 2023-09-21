import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';


type Extension = {extension: Extension} | readonly Extension[];


export class EditorBase {
  view: EditorView;
  extensions: Extension[];

  // private _value = '';
  // private _scrollTop = 0;

  // constructor(textarea: HTMLTextAreaElement, controls?: NodeList, value?: string) { }

  get hidden(): boolean {
    return false;
  }

  get value(): string {
    return this.view.state.doc.toString();
  }

  set value(text: string) {
    // this.view.dispatch({
    //   changes: {from: 0, to: this.view.state.doc.length, insert: text}
    // });
    this.view.setState(EditorState.create({doc: text, extensions: this.extensions}));
  }

  get wrapper(): HTMLTextAreaElement {
    return null; 
  }

  get scrollTop(): number {
    return 0; 
  }

  set scrollTop(value: number) {
    // this._scrollTop = value;

  }

  get scroll(): HTMLElement {
    return document.body; 
  }

  getData(text?: string) {
    const value = text || this.view.state.doc.toString();
    const data: string[] = (value || '').split(/^([^\n]*)\r?\n/).filter((w, i) => i < 1 && w || i);
    const title: string = (data && data.length) ? data[0].trim() : '';
    const description: string = (data && data.length > 1) ? data[1] : '';

    return [title, description];
  }

  render() {
    return '';
  }

  hide() {
    // console.log('hide');
  }

  show() {
    // console.log('show');
  }

  refresh() {
    // console.log('refresh');
  }

  focus() {
    this.view.focus();
  }

  getCursor(): string {
    return '';
  }

  setSelection(selection: string) {
    // console.log('show', [selection]);
  }

  getSelection() {
    return '';
  }

  public on(event: string, callback: () => void) {
    // console.log('on', [event]);
  }
}
