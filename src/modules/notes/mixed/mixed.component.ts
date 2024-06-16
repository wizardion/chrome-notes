import './assets/mixed.scss';
import { BaseElement, IEventIntervals } from 'core/components';
import { PopupBaseElement } from '../base-popup/popup.component';
import { INote } from '../details-base/models/details-base.model';
import { DbProviderService } from 'modules/db';
import { ICachedSettings } from 'core/services/cached/models/cached.models';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './mixed.component.html'
});

const INTERVALS: IEventIntervals = {
  delay: 260, intervals: { collapsed: null }
};

export class PopupMixedNotesElement extends PopupBaseElement {
  static readonly selector = 'popup-notes';

  private listToggler: HTMLButtonElement;
  private collapsedList: boolean;

  constructor() {
    super();

    this.items = [];
    this.template = <HTMLElement>template.cloneNode(true);
    this.listView = this.template.querySelector('[name="list-view"]');
    this.detailsView = this.template.querySelector('[name="details-view"]');
    this.listToggler = this.template.querySelector('[name="list-toggle"]');
  }

  protected render(): void {
    super.render();

    const listControls = this.listView.elements.controls;
    const addNote = this.listView.elements.create;
    const head = this.detailsView.elements.head;

    head.insertBefore(addNote, head.firstChild);
    listControls.insertBefore(this.listToggler, listControls.firstChild);
  }

  protected async eventListeners() {
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
  }

  init(): void {
    super.init();

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
      await super.select(this.items[index > 0 ? index - 1 : 0]);
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
      INTERVALS.intervals.collapsed = setTimeout(() => this.classList.remove('collapsed-extended'), INTERVALS.delay);
    }

    await DbProviderService.cache.set<ICachedSettings>('settings', { collapsed: this.collapsedList });
  }

  set collapsed(value: boolean) {
    this.collapsedList = value;
    this.listToggler.dataset.checked = value.toString();

    if (value) {
      this.classList.add('collapsed');
    }

    if (!this.classList.contains('collapsed-animating')) {
      setInterval(() => this.classList.add('collapsed-animating'), INTERVALS.delay);
    }
  }

  set hidden(value: boolean) {
    super.hidden = value;
    this.listView.hidden = value;
    this.detailsView.hidden = value;
  }
}
