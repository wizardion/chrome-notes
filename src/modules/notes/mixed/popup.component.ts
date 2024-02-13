import './assets/mixed.scss';
import { BaseElement } from 'core/components';
import { PopupBaseElement } from '../base-popup/popup.component';
import { DbProviderService } from 'modules/db';
import { INote } from '../details-base/details-base.model';


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

  select(item: INote, rendered = true) {
    this.selected?.item.classList.remove('selected');
    this.detailsView.draft = false;

    if (rendered) {
      this.selected = item;
      this.selected.item.classList.add('selected');
      DbProviderService.cache.set('selected', this.selected);
    } else {
      this.preserved = item;
    }

    this.detailsView.setData(item);
  }

  draft(title?: string, description?: string, selection?: number[]) {
    this.detailsView.draft = true;
    this.selected?.item.classList.remove('selected');
    this.selected = null;

    this.detailsView.setData({
      id: null,
      order: null,
      updated: null,
      created: null,
      deleted: null,
      title: title || '',
      description: description || '',
      cState: selection || [0, 0]
    });
  }
}
