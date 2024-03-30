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

    this.select(this.items[index > 0 ? index - 1 : 0]);

    return index;
  }
}
