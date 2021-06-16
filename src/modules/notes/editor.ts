import 'codemirror/mode/markdown/markdown.js'
import 'codemirror/mode/gfm/gfm.js'
import 'codemirror/addon/edit/continuelist.js';
import 'codemirror/addon/mode/overlay.js';
// import 'codemirror/addon/selection/mark-selection.js'; // for search control
import 'codemirror/lib/codemirror.css';
import '../../styles/codemirror.scss';
// import {fromTextArea, EditorFromTextArea, KeyMap, Position, Doc} from 'codemirror';
import * as CodeMirror from 'codemirror';
import {MDRender} from './components/md-render';
var CodeMirrorSpellChecker = require('codemirror-spell-checker');


export class Editor {
  private visible: boolean;
  private md: MDRender;
  private codemirror: CodeMirror.EditorFromTextArea;
  private controls: NodeList;
  private doc: CodeMirror.Doc;
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
    'undo':                 () => this.visible && this.codemirror.undo(),
    'redo':                 () => this.visible && this.codemirror.redo(),
  };

  constructor(textarea: HTMLTextAreaElement, controls?: NodeList) {
    this.controls = controls;

    CodeMirrorSpellChecker({
        codeMirrorInstance: CodeMirror
    });

    this.codemirror = CodeMirror.fromTextArea(textarea, {
      theme: 'paper',
      mode: 'spell-checker',
      // @ts-ignore
      backdrop: {
        name: 'gfm',
        gitHubSpice: false
      },
      lineWrapping: true,
      showCursorWhenSelecting: true,
      tabSize: 2,
      indentUnit: 2,
      indentWithTabs: false,
      lineNumbers: false,
      allowDropFileTypes: ['text/plain']
      // viewportMargin: 10000,
      // spellcheck: false,
      // autocorrect: false,
      // inputStyle: 'contenteditable',
      // mode: {
      //   name: 'markdown',
      // }
    });

    this.doc = this.codemirror.getDoc();
    this.wrapper = <HTMLTextAreaElement>this.codemirror.getWrapperElement();
    this.scroll = this.wrapper.querySelector('.CodeMirror-vscrollbar');
    this.visible = true;

    setTimeout(() => this.init());
  }

  private init() {
    this.md = new MDRender();
    var mapping: CodeMirror.KeyMap = {};

    this.controls.forEach((item: HTMLElement) => {
      const action: string = item.getAttribute('action');
      const keys: string = item.getAttribute('keys');
      const event: EventListener = this.actions[action];

      if (event && keys) {
        keys.split(',').forEach(key => {
          mapping[key] = event.bind(this);
        });
      }

      if (event) {
        item.onclick = event;
      }

      item.onmousedown = (e: MouseEvent) => e.preventDefault();
    });

    mapping['Enter'] = 'newlineAndIndentContinueMarkdownList';
    mapping['Tab'] = () => this.indentTab();
    mapping['Shift-Tab'] = () => this.shiftTab();

    this.codemirror.setOption("extraKeys", mapping);
  }

  public get value(): string {
    return this.codemirror.getValue();
  }

  public set value(text: string) {
    this.doc.setValue(text);
    this.codemirror.refresh();
    setTimeout(() => this.codemirror.clearHistory());
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
    var selection: number[][] = [];

    ranges.forEach((range) => {
      selection.push([range.anchor.ch, range.head.ch, range.anchor.line, range.head.line]);
    });

    return `${scrollInfo.top}|${selection.join(':')}`;
  }

  public setSelection(data?: string) {
    this.codemirror.focus();

    if (data && data.length > 1) {
      let [scrollTop, selection] = data.split('|');
      let ranges: ObjectArray = [];

      selection.split(':').forEach((range) => {
        const [x1, x2, y1, y2]: string[] = range.split(',');

        ranges.push({
          anchor: {ch: Number(x1) || 0, line: Number(y1) || 0},
          head: {ch: Number(x2) || 0, line: Number(y2) || 0}
        });
      });

      this.doc.setSelections(ranges);
      this.codemirror.scrollTo(0, Number(scrollTop) || 0);
    } else {
      this.doc.setCursor({line: 0, ch: 0});
    }
  }

  public render(): string {
    var [title, text] = this.getData();
    var html = this.md.render(text);

    return `<div class="title">${title}</div>${html}`;
  }

  public hide() {
    this.visible = false;
    this.wrapper.style.display = 'none';
    this.controls.forEach((item: HTMLElement) => item.classList.add('disabled'));
  }

  public show() {
    this.visible = true;
    this.wrapper.style.display = 'inherit';
    this.controls.forEach((item: HTMLElement) => item.classList.remove('disabled'));
  }

  private command(action: Function, ...args: any[]) {
    if (this.visible) {
      var text = this.codemirror.getSelection().trim();

      if (text.length) {
        action.call(this, text, ...args);
      }
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
      let cursor: CodeMirror.Position = this.codemirror.getCursor();

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
      let cursor: CodeMirror.Position = this.codemirror.getCursor();
      this.codemirror.setSelection(
        { ch: cursor.ch - 4, line: cursor.line },
        { ch: cursor.ch - 1, line: cursor.line }
      );
    } else {
      this.codemirror.replaceSelection(text.replace(rule, '$1'), 'around');
    }
  }

  private indentTab() {
    var linesSelected =  document.getElementsByClassName('CodeMirror-selected').length;

    if (linesSelected > 1) {
      return this.codemirror.execCommand('indentMore');
    }

    var spaces = Array((this.codemirror.getOption('tabSize') || 2) + 1).join(' ');
    this.codemirror.replaceSelection(spaces);

    // var ranges = this.codemirror.listSelections();
    // var pos = ranges[0].head;
    // var eolState = this.codemirror.getStateAfter(pos.line);
    // var inList = !!eolState.list;
  }

  private shiftTab() {
    var linesSelected =  document.getElementsByClassName('CodeMirror-selected').length;

    if (linesSelected > 1) {
      return this.codemirror.execCommand('indentLess');
    }

    var cursor = this.doc.getCursor();
    var line = this.doc.getLine(cursor.line);

    if (line.substring(0, cursor.ch).match(/[ ]{2,}$/)) {
      var position = {ch: cursor.ch - (this.codemirror.getOption('tabSize') || 2), line: cursor.line};
      this.doc.setSelection(position, cursor);
      this.doc.replaceSelection('');
    }
  }
}
