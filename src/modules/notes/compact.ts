import {IListView, INewNoteView, INoteView} from './components/interfaces';
import { Mixed } from './mixed';


export class Comact extends Mixed {
  constructor(listView: IListView, noteView: INoteView, newView: INewNoteView) {
    super(listView, noteView, newView);

    this.listView.node.classList.add('compact');
    this.noteView.node.classList.add('compact');

    this.noteView.delete.style.display = 'none';
    this.noteView.sync.parentElement.style.display = 'none';
    this.noteView.preview.parentElement.style.display = 'none';

    this.noteView.editor.hide();
  }
}
