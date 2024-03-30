import './assets/window.scss';
import { BaseElement } from 'core/components';
import { PopupBaseElement } from '../base-popup/popup.component';
import { INote } from '../details-base/models/details-base.model';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './window.component.html'
});

export class WindowNotesElement extends PopupBaseElement {
  static readonly selector = 'popup-notes';

  constructor() {
    super();

    this.items = [];
    this.template = <HTMLElement>template.cloneNode(true);
    this.listView = this.template.querySelector('[name="list-view"]');
    this.detailsView = this.template.querySelector('[name="details-view"]');
  }

  protected render(): void {
    super.render();

    const addNote = this.listView.elements.create;
    const head = this.detailsView.elements.head;

    head.insertBefore(addNote, head.firstChild);
  }

  protected async eventListeners() {
    super.eventListeners();

    const tabInfo = await chrome.tabs.getCurrent();

    chrome.storage.local.set({ tabInfo: { id: tabInfo.id, window: tabInfo.windowId } });
  }

  init(): void {
    super.init();

    if (!this.items.length) {
      this.create();
    }
  }

  async select(item: INote) {
    if (this.selected && !this.selected.description) {
      await this.delete();
      this.selected = null;
    }

    super.select(item);
  }

  async delete(): Promise<number> {
    const index = await super.delete();

    if (!this.items.length) {
      this.create();

      return index;
    }

    return index;
  }
}
