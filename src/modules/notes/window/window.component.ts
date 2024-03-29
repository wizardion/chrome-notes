import './assets/window.scss';
import { BaseElement } from 'core/components';
import { PopupBaseElement } from '../base-popup/popup.component';
import { DbProviderService } from 'modules/db';
import { INote } from '../details-base/models/details-base.model';
// import { ListItemElement } from '../list-item/list-item.component';


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
    const svg = this.template.querySelector('[name="cancel-svg"]');

    super.render();
    const addNote = this.listView.elements.add;
    const head = this.detailsView.elements.cancel.parentNode;

    head.insertBefore(addNote, head.firstChild);

    this.detailsView.elements.cancel.innerText = '';
    this.detailsView.elements.cancel.appendChild(svg);
    this.detailsView.elements.cancel.classList.remove('back');
  }

  protected async eventListeners() {
    super.eventListeners();

    const tabInfo = await chrome.tabs.getCurrent();

    chrome.storage.local.set({ tabInfo: { id: tabInfo.id, window: tabInfo.windowId } });
  }

  async goBack() {
    const note = this.items.length > 0 ? this.preserved || this.items[this.items.length - 1] : null;

    if (this.drafted) {
      this.drafted.item.remove();
      this.drafted = null;
    }

    this.detailsView.draft = false;

    DbProviderService.cache.remove(['draft', 'selected']);

    if (note) {
      this.select(this.preserved || this.items[this.items.length - 1]);
    } else {
      this.draft();
      this.onCreate();
      this.select(this.items[0]);
    }
  }

  async select(item: INote) {
    this.selected?.item.classList.remove('selected');
    this.detailsView.draft = false;
    this.listView.elements.add.hidden = false;

    if (this.drafted) {
      this.goBack();
    }

    if (this.initialized) {
      this.selected = item;
      this.selected.item.classList.add('selected');
      await DbProviderService.cache.set('selected', this.selected);
    } else {
      this.preserved = item;
    }

    this.detailsView.setData(item);
  }

  draft(title?: string, description?: string, selection?: number[]) {
    this.selected?.item.classList.remove('selected');
    this.preserved = this.selected;

    super.draft(title, description, selection);

    this.detailsView.draft = true;
    this.listView.elements.add.hidden = true;
    this.detailsView.hidden = false;
    this.listView.hidden = false;
    this.selected = null;
  }

  async onCreate() {
    super.onCreate();

    this.listView.elements.add.hidden = false;
    this.selected.item.classList.add('selected');
    this.selected.item.scrollIntoView({ behavior: 'instant', block: 'center' });
  }
}
