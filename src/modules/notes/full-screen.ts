import {DbNote} from '../db/note';
import storage from '../storage/storage';
import {IListView, INewNoteView, INoteView} from './components/interfaces';
import {Mixed} from './mixed';


export class FullScreen extends Mixed {
  protected mode: number;

  constructor(listView: IListView, noteView: INoteView, newView: INewNoteView) {
    super(listView, noteView, newView);

    this.listView.node.classList.add('full-screen');
    this.noteView.node.classList.add('full-screen');

    document.body.classList.add('full-size');
    document.body.parentElement.classList.add('full-size');

    this.noteView.delete.style.display = 'none';
    this.noteView.sync.parentElement.style.display = 'none';
    this.noteView.preview.parentElement.style.display = 'none';

    this.noteView.editor.hide();

    setInterval(this.timer.bind(this), 1000);
  }

  // public init() {
  //   super.init();

  //   if (chrome && chrome.tabs) {
  //     chrome.tabs.query({active: true}, (tabs: chrome.tabs.Tab[]) => {
  //       if (tabs.length === 1) {
  //         this.saveTabInfo(tabs[0]);
  //       }
  //     });
  //   }
  // }

  protected build(notes: DbNote[]) {
    super.build(notes);

    window.addEventListener('resize', this.screenResize.bind(this));

    this.mode = Number(storage.get('mode', true) || '0');
  }

  protected timer() {
    this.saveScreenPossition();
  }

  protected screenResize() {
    if (this.noteView.editor) {
      this.noteView.editor.refresh();
      this.saveScreenPossition();
    }
  }

  // protected saveTabInfo(tab: chrome.tabs.Tab) {
  //   chrome.storage.local.set({tabInfo: {
  //     id: tab.id, 
  //     windowId: tab.windowId,
  //     width: tab.width,
  //     height: tab.height
  //   }});
  // }

  protected saveScreenPossition() {
    if (this.mode === 4 && chrome && chrome.storage) {
      chrome.storage.local.set({window: {
        top: window.screenTop,
        left: window.screenLeft,
        width: window.outerWidth,
        height: window.outerHeight,
      }});
    }
  }
}
