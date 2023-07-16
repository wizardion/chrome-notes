import {DbNote} from '../db/note';
// import storage from '../storage/storage';
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
    this.noteView.preview.parentElement.style.display = 'none';

    this.noteView.editor.hide();

    setInterval(this.timer.bind(this), 1000);
  }

  public init() {
    super.init();

    if (chrome && chrome.tabs) {
      chrome.tabs.getCurrent((tab: chrome.tabs.Tab) => {
        if (tab) {
          this.saveTabInfo(tab.id, tab.windowId);
        }
      });
    }
  }

  protected build(notes: DbNote[]): void {
    super.build(notes);

    window.addEventListener('resize', this.screenResize.bind(this));
    // storage.cached.get(['mode']).then((mode) => {
    //   console.log('mode', mode);
    //   this.mode = Number(mode);
    // });
  }

  protected timer() {
    this.saveScreenPosition();
  }

  protected screenResize() {
    if (this.noteView.editor) {
      this.noteView.editor.refresh();
      this.saveScreenPosition();
    }
  }

  protected saveTabInfo(tabId: number, windowId?: number) {
    chrome.storage.local.set({tabInfo: {
      id: tabId, 
      windowId: windowId,
      width: null,
      height: null
    }});
  }

  protected saveScreenPosition() {
    console.log('this.mode',this.mode);

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
