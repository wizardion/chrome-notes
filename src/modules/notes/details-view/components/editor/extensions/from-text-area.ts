import { EditorView } from '@codemirror/view';
import { IExtension } from './extension.model';


export function editorFromTextArea(value: string, textarea: HTMLTextAreaElement, extensions: IExtension[]) {
  const view = new EditorView({ doc: value, extensions, parent: document.body });

  textarea.parentNode.insertBefore(view.dom, textarea);
  textarea.style.display = 'none';

  return view;
}
