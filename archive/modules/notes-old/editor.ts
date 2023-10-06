import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';


type Extension = {extension: Extension} | readonly Extension[];


export class EditorBase {
  view: EditorView;
  extensions: Extension[];

  // private _value = '';
  // private _scrollTop = 0;

  // constructor(textarea: HTMLTextAreaElement, controls?: NodeList, value?: string) { }

  
}
