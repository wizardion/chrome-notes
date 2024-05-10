import './assets/mixed.scss';
import { BaseElement } from 'core/components';
import { PopupBaseElement } from '../base-popup/popup.component';
import { INote } from '../details-base/models/details-base.model';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './popup.component.html'
});

export class PopupMixedNotesElement extends PopupBaseElement {
  static readonly selector = 'popup-notes';

  constructor() {
    super();

    this.items = [];
    this.template = <HTMLElement>template.cloneNode(true);
    this.listView = this.template.querySelector('[name="list-view"]');
    this.detailsView = this.template.querySelector('[name="details-view"]');
  }

  protected async eventListeners() {
    this.listView.addEventListener('create', () => !this.disabled && this.create());
    this.detailsView.addEventListener('changed', (e) => !this.disabled && this.onChanged(e));
    this.detailsView.addEventListener('delete', async () => !this.disabled && await this.delete());

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
}
