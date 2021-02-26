import 'codemirror/mode/markdown/markdown.js'
import 'codemirror/lib/codemirror.css';
import '../../styles/codemirror.scss';
import {fromTextArea, EditorFromTextArea, KeyMap, Position, commands} from 'codemirror';
import {MDRender} from './components/md-render';


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
  private md: MDRender;
  private codemirror: EditorFromTextArea;
  public wrapper: HTMLTextAreaElement;
  public scroll: HTMLElement;

  private actions: {[action: string]: EventListener} = {
    'bold':                 () => this.command(this.simpleCommand, '**${text}**'),
    'strikethrough':        () => this.command(this.simpleCommand, '~~${text}~~'),
    'italic':               () => this.command(this.simpleCommand, '*${text}*'),
    'insertOrderedList':    () => this.command(this.insertList, '1. '),
    'insertUnorderedList':  () => this.command(this.insertList, '- '),
    'removeFormat':         () => this.command(this.removeFormat),
    'link':                 () => this.command(this.insertLink),
    'undo':                 () => this.codemirror.undo(),
    'redo':                 () => this.codemirror.redo(),
  };

  constructor(textarea: HTMLTextAreaElement, controls?: NodeList) {
    this.md = new MDRender();
    this.codemirror = fromTextArea(textarea, {
      lineWrapping: true,
      showCursorWhenSelecting: true,
      mode: {
        name: 'markdown',
      }
    });

    this.wrapper = <HTMLTextAreaElement>this.codemirror.getWrapperElement();
    this.scroll = this.wrapper.querySelector('.CodeMirror-vscrollbar');
    this.init(controls);
  }

  private init(controls?: NodeList) {
    var mapping: KeyMap = {};

    controls.forEach((item: HTMLElement) => {
      const action: string = item.getAttribute('action');
      const key: string = item.getAttribute('key');
      const event: EventListener = this.actions[action];

      if (event && key) {
        mapping[key] = event.bind(this);
      }

      if (event) {
        item.onclick = event;
      }

      item.onmousedown = (e: MouseEvent) => e.preventDefault();
    });

    this.codemirror.setOption("extraKeys", mapping);
  }

  public get value(): string {
    return this.codemirror.getValue();
  }

  public set value(text: string) {
    this.codemirror.setValue('');
    this.codemirror.replaceSelection(text);
    this.codemirror.clearHistory();
  }

  public get scrollTop(): number {
    return this.codemirror.getScrollInfo().top;
  }

  public set scrollTop(top: number) {
    this.codemirror.scrollTo(0, top);
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
    } else {
      this.codemirror.setCursor({ line: 0, ch: 0 });
    }
  }

  public render(): string {
    var [title, text] = this.getData();
    var html = this.md.render(text);

    return `<div class="title">${title}</div>${html}`;
  }

  public hide() {
    this.wrapper.style.display = 'none';
  }

  public show() {
    this.wrapper.style.display = '';
  }

  private command(action: Function, ...args: any[]) {
    var text = this.codemirror.getSelection().trim();

    if (text.length) {
      action.call(this, text, ...args);
    }
  }

  private simpleCommand(text: string, template: string) {
    var regex = new RegExp(template.replace(/\$\{text\}/gi, '(.+)').replace(/([^()\.+])/gi, '\\$1'), 'gi');
    var value = text.match(regex) ? text.replace(regex, '$1') : template.replace(/\$\{text\}/gi, text);

    this.codemirror.replaceSelection(value, 'around');
  }

  private removeFormat(text: string) {
    var html = this.md.render(text).replace(/(th|td)\>\n\<(th|td)/gi, '$1\> \<$2');
    var dirt = this.md.unescapeAll(html.replace(/(<([^>]+)>)/gi, ''));
    var plain = dirt.replace(/^[\s\n\r]+|[\s\n\r]+$|(\n)[\s\n\r]+/gi, '$1');

    this.codemirror.replaceSelection(plain, 'around');
  }

  private insertList(text: string, prefix: string) {
    if (!text.match(/^1.\s|^-\s/gi)) {
      let cursor: Position = this.codemirror.getCursor();

      if ((cursor.ch > 0 ? text.length - cursor.ch : cursor.ch) !== 0) {
        this.codemirror.replaceSelection(`\n`);
      }

      this.codemirror.replaceSelection(text.replace(/^|(\n)/gi, `$1${prefix}`), 'around');
    } else {
      this.codemirror.replaceSelection(text.replace(/^1.\s|^-\s/gim, ''), 'around');
    }
  }

  private insertLink(text: string) {
    let rule = /\s*\[(.+)\].*/gi;
    let template = '[${text}](url)';

    if (!text.match(rule)) {
      this.codemirror.replaceSelection(template.replace(/\$\{text\}/gim, text), 'end');
      let cursor: Position = this.codemirror.getCursor();
      this.codemirror.setSelection(
        { ch: cursor.ch - 4, line: cursor.line },
        { ch: cursor.ch - 1, line: cursor.line }
      );
    } else {
      this.codemirror.replaceSelection(text.replace(rule, '$1'), 'around');
    }
  }
}