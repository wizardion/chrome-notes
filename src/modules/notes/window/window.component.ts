import './assets/window.scss';
import { BaseElement, IEventIntervals } from 'core/components';
import { PopupBaseElement } from '../base-popup/popup.component';
import { INote } from '../details-base/models/details-base.model';
import { DbProviderService } from 'modules/db/db-provider.service';
import { getSettings } from 'modules/settings';
import { ITabInfo } from 'modules/settings/models/settings.model';
import { ICachedSettings } from 'core/services/cached/models/cached.models';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './window.component.html'
});
const INTERVALS: IEventIntervals = {
  delay: null, intervals: { changed: null, locked: null, collapsed: null, saving: null, indicator: null }
};

export class WindowNotesElement extends PopupBaseElement {
  static readonly selector = 'popup-notes';
  protected triggerDelay = 1400;
  protected tabInfo: ITabInfo;
  protected indicator: HTMLElement;

  private listToggler: HTMLButtonElement;
  private collapsedList: boolean;

  constructor() {
    super();

    this.items = [];
    this.template = <HTMLElement>template.cloneNode(true);
    this.listView = this.template.querySelector('[name="list-view"]');
    this.detailsView = this.template.querySelector('[name="details-view"]');
    this.listToggler = this.template.querySelector('[name="list-toggle"]');
    this.indicator = this.template.querySelector('[name="indicator"]');
  }

  protected render(): void {
    super.render();

    const listControls = this.listView.elements.controls;
    const addNote = this.listView.elements.create;
    const head = this.detailsView.elements.head;

    head.insertBefore(addNote, head.firstChild);
    head.insertBefore(this.indicator, head.lastElementChild);
    listControls.insertBefore(this.listToggler, listControls.firstChild);
  }

  protected async eventListeners() {
    this.tabInfo = (await chrome.storage.local.get('tabInfo')).tabInfo as ITabInfo || { id: 0, window: 0 };
    const tab = await chrome.tabs.getCurrent();
    const settings = await getSettings();

    this.listView.addEventListener('create', () => !this.disabled && this.create());
    this.detailsView.addEventListener('changed', (e) => !this.disabled && this.onChanged(e));
    this.detailsView.addEventListener('delete', async () => !this.disabled && await this.delete());
    this.listToggler.addEventListener('mousedown', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!this.disabled) {
        await this.toggleList();
      }
    });

    super.eventListeners();

    if (settings.common.mode === 4) {
      window.addEventListener('resize', () => this.onWindowChange(tab.id, tab.windowId));
      setInterval(() => this.onWindowChange(tab.id, tab.windowId), 1.4e+4);
    }

    await this.saveTabInfo(tab.id, tab.windowId);
  }

  init(): void {
    this.disabled = false;
    this.initialized = true;
    DbProviderService.init(true);

    if (!this.items.length) {
      this.create();
    }

    this.detailsView.elements.delete.disabled = this.items.length < 2;
  }

  async select(item: INote) {
    if (this.selected && !this.selected.description) {
      await super.delete(100);
      this.detailsView.elements.delete.disabled = this.items.length < 2;
    }

    return super.select(item);
  }

  async delete(delay?: number): Promise<number> {
    const index = await super.delete(delay);

    this.detailsView.elements.delete.disabled = this.items.length < 2;

    if (!delay) {
      await this.select(this.items[index > 0 ? index - 1 : 0]);
    }

    return index;
  }

  async create() {
    await super.create();
    this.detailsView.elements.delete.disabled = this.items.length < 2;
    this.listView.elements.scrollable.scrollTop =
      this.listView.elements.scrollable.scrollHeight - this.listView.elements.scrollable.offsetHeight;
  }

  async toggleList() {
    this.collapsedList = !this.collapsedList;
    this.listToggler.dataset.checked = this.collapsedList.toString();
    this.classList.toggle('collapsed');

    if (!this.collapsedList) {
      this.classList.add('collapsed-extended');

      clearInterval(INTERVALS.intervals.collapsed);
      INTERVALS.intervals.collapsed = setTimeout(() => this.classList.remove('collapsed-extended'), 260);
    }

    await DbProviderService.cache.set<ICachedSettings>('settings', { collapsed: this.collapsedList });
  }

  async onChanged(e: Event) {
    if (this.selected) {
      const data = this.detailsView.getData();

      if (data.description !== this.selected.description || data.preview !== this.selected.preview) {
        const date = new Date();
        const time = date.getTime();

        this.selected.push = true;
        this.selected.updated = time;
        this.selected.item.date = date;

        this.indicator.hidden = false;
        clearInterval(INTERVALS.intervals.indicator);
      }

      this.selected.title = data.title;
      this.selected.description = data.description;
      this.selected.cState = data.selection;
      this.selected.pState = data.previewSelection;
      this.selected.item.title = data.title;
      this.selected.preview = data.preview;
      this.listView.elements.create.disabled = !data.description;

      clearInterval(INTERVALS.intervals.saving);

      if (e.type === 'change') {
        INTERVALS.intervals.saving = setTimeout(async () => await this.save(this.selected), this.triggerDelay);
      } else {
        await this.save(this.selected);
      }
    }
  }

  async save(item: INote) {
    await super.save(item);
    INTERVALS.intervals.indicator = setTimeout(() => this.indicator.hidden = true, this.triggerDelay);
  }

  onWindowChange(id: number, windowId?: number) {
    clearInterval(INTERVALS.intervals.changed);
    INTERVALS.intervals.changed = setTimeout(async () => this.saveWindowInfo(id, windowId), this.triggerDelay);
  }

  set collapsed(value: boolean) {
    this.collapsedList = value;

    if (value) {
      this.classList.add('collapsed');
    }

    this.listToggler.dataset.checked = value.toString();

    if (!this.classList.contains('collapsed-animating')) {
      clearInterval(INTERVALS.intervals.collapsed);
      INTERVALS.intervals.collapsed = setInterval(() => this.classList.add('collapsed-animating'), 260);
    }
  }

  set hidden(value: boolean) {
    super.hidden = value;
    this.listView.hidden = value;
    this.detailsView.hidden = value;
  }

  private async saveWindowInfo(id: number, windowId?: number) {
    const { screenTop, screenLeft, outerWidth, outerHeight } = window;

    if (this.tabInfo.id !== id || this.tabInfo.window !== windowId || this.tabInfo.top !== screenTop ||
        this.tabInfo.left !== screenLeft || this.tabInfo.width !== outerWidth || this.tabInfo.height !== outerHeight) {
      this.tabInfo.id = id;
      this.tabInfo.window = windowId;
      this.tabInfo.top = screenTop;
      this.tabInfo.left = screenLeft;
      this.tabInfo.width = outerWidth;
      this.tabInfo.height = outerHeight;

      return chrome.storage.local.set({ tabInfo: this.tabInfo });
    }
  }

  private async saveTabInfo(tabId: number, windowId?: number) {
    this.tabInfo.id = tabId;
    this.tabInfo.window = windowId;

    return chrome.storage.local.set({ tabInfo: this.tabInfo });
  }
}
