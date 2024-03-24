import {DbNote} from '../db/note';
import {IListView, INewNoteView, INoteView} from './components/interfaces';
import {Mixed} from './mixed';


export class Screen extends Mixed {
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
  }

  public async init() {
    await super.init();
    this.setTabInfo();
  }

  protected async setTabInfo() {
    await chrome.storage.local.remove('tabInfo');

    chrome.tabs.getCurrent(async (tab: chrome.tabs.Tab) => {
      if (tab) {
        await chrome.storage.local.set({
          tabInfo: {
            id: tab.id,
            windowId: tab.windowId,
            width: null,
            height: null,
          },
        });
      }
    });
  }
}
