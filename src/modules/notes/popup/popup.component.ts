import { BaseElement } from 'core/components';
import { PopupBaseElement } from '../base-popup/popup.component';
import { INote } from '../details-base/models/details-base.model';


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

  async goBack() {
    if (this.selected && !this.selected.description) {
      this.delete();

      return;
    }

    await this.onChanged();
    this.listView.hidden = false;
    this.detailsView.hidden = true;

    this.selected?.item.animateItem();
    this.selected = null;

    await super.goBack();
  }

  async select(item: INote) {
    this.listView.hidden = true;
    this.detailsView.hidden = false;

    super.select(item);
  }
}
