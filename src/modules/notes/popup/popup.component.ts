import { BaseElement } from 'core/components';
import { PopupBaseElement } from '../base-popup/popup.component';
import { INote } from '../details-base/models/details-base.model';
import { DbProviderService } from 'modules/db';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './popup.component.html'
});

export class PopupNotesElement extends PopupBaseElement {
  static readonly selector = 'popup-notes';

  constructor() {
    super();

    this.items = [];
    this.template = <HTMLElement>template.cloneNode(true);
    this.listView = this.template.querySelector('[name="list-view"]');
    this.detailsView = this.template.querySelector('[name="details-view"]');
  }

  protected render() {
    super.render();

    this.listView.hidden = false;
  }

  protected async eventListeners() {
    this.listView.addEventListener('create', () => !this.disabled && this.create());
    this.detailsView.addEventListener('cancel', () => !this.disabled && this.goBack());
    this.detailsView.addEventListener('changed', () => !this.disabled && this.onChanged());
    this.detailsView.addEventListener('delete', () => !this.disabled && this.goBack(true));

    super.eventListeners();
  }

  async select(item: INote) {
    this.listView.hidden = true;
    this.detailsView.hidden = false;

    super.select(item);
  }

  async goBack(remove?: boolean) {
    this.listView.hidden = false;
    this.detailsView.hidden = true;
    this.selected?.item.highlightItem();

    if (remove || this.selected && !this.selected.description) {
      await super.delete(100);
    } else {
      await this.onChanged();
    }

    this.selected = null;
    await DbProviderService.cache.remove(['selected']);
  }
}
