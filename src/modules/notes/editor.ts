// import 'codemirror/addon/display/placeholder'
import 'codemirror/mode/markdown/markdown.js'
import 'codemirror/mode/gfm/gfm.js';
import 'codemirror/lib/codemirror.css';
import '../../styles/codemirror.scss';
import {fromTextArea, EditorFromTextArea} from 'codemirror';

interface IRange {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

interface ISelection {
  ranges: IRange[],
  scrollTop: number
}

export class Editor {
  private codemirror: EditorFromTextArea;
  public wrapper: HTMLTextAreaElement;
  public scroll: HTMLElement;

  constructor(textarea: HTMLTextAreaElement) {
    this.codemirror = fromTextArea(textarea, {
      lineWrapping: true,
      showCursorWhenSelecting: true,
      mode: {
        name: 'gfm'
      }
    });

    this.wrapper = <HTMLTextAreaElement>this.codemirror.getWrapperElement();
    this.scroll = this.wrapper.querySelector('.CodeMirror-vscrollbar');

    this.init();
  }

  private init() {

  }

  public get value(): string {
    return this.codemirror.getValue();
  }

  public set value(text: string) {
    this.codemirror.setValue('');
    this.codemirror.replaceSelection(text);
  }

  public on(event: string, callback: Function) {
    this.codemirror.on(event, () => callback());
  }

  public focus() {
    this.codemirror.focus();
  }

  public getData() {
    var value = this.codemirror.getValue();
    var data: string[] = (value || '').split(/^([^\n]*)\r?\n/).filter((w, i) => i < 1 && w || i);
    var title: string = (data && data.length) ? data[0].trim() : '';
    var description: string = (data && data.length > 1) ? data[1] : '';

    return [title, description];
  }

  public getSelection(): string {
    let scrollInfo = this.codemirror.getScrollInfo();
    var ranges = this.codemirror.listSelections();
    var selection: ISelection = {
      ranges: [],
      scrollTop: scrollInfo.top
    };

    ranges.forEach((range) => {
      selection.ranges.push({
        x1: range.anchor.ch,
        x2: range.head.ch,
        y1: range.anchor.line,
        y2: range.head.line
      })
    });

    return JSON.stringify(selection);
  }

  public setSelection(data?: string) {
    this.codemirror.focus();

    if (data) {
      let selection: ISelection = <ISelection>JSON.parse(data);
      let ranges: ObjectArray = [];

      selection.ranges.forEach((range: IRange) => {
        ranges.push({
          anchor: {ch: range.x1, line: range.y1},
          head: {ch: range.x2, line: range.y2}
        });
      });

      this.codemirror.setSelections(ranges);
      this.codemirror.scrollTo(0, selection.scrollTop);
      console.log('set selection');
    } else {
      console.log('set cursor');
      this.codemirror.setCursor({ line: 0, ch: 0 });
    }
  }
}