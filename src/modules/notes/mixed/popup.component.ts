import './assets/mixed.scss';
import { BaseElement } from 'core/components';
import { PopupBaseElement } from '../base-popup/popup.component';
import { DbProviderService } from 'modules/db';
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

  protected render(): void {
    const svg = this.template.querySelector('[name="cancel-svg"]');

    super.render();
    const head = this.listView.elements.add.parentElement;

    head.insertBefore(this.detailsView.elements.cancel, head.firstChild);

    this.detailsView.elements.cancel.innerText = '';
    this.detailsView.elements.cancel.appendChild(svg);
    this.detailsView.elements.cancel.classList.remove('back');
  }

  async goBack() {
    const note = this.preserved ? this.preserved : this.items.length > 0 ? this.items[this.items.length - 1] : null;

    this.detailsView.draft = false;

    DbProviderService.cache.remove(['draft', 'selected']);

    if (note) {
      this.select(this.preserved || this.items[this.items.length - 1]);
    }
  }

  async select(item: INote, rendered = true) {
    this.selected?.item.classList.remove('selected');
    this.detailsView.draft = false;
    this.listView.elements.add.hidden = false;

    if (rendered) {
      this.selected = item;
      this.selected.item.classList.add('selected');
      await DbProviderService.cache.set('selected', this.selected);
    } else {
      this.preserved = item;
    }

    this.detailsView.setData(item);
  }

  draft(title?: string, description?: string, selection?: number[]) {
    this.detailsView.draft = true;
    this.preserved = this.selected;
    this.listView.elements.add.hidden = true;
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

  async onCreate() {
    super.onCreate();

    this.listView.elements.add.hidden = false;
    this.selected.item.classList.add('selected');
    this.selected.item.scrollIntoView({ behavior: 'instant', block: 'center' });
  }
}
