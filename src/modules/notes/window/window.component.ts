import './assets/window.scss';
import { BaseElement } from 'core/components';
import { PopupBaseElement } from '../base-popup/popup.component';
import { DbProviderService } from 'modules/db';
import { INote } from '../details-base/details-base.model';


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

  goBack() {
    this.detailsView.draft = false;

    DbProviderService.cache.remove(['draft', 'selected']);

    this.select(this.preserved);
  }

  select(item: INote, rendered = true) {
    this.selected?.item.classList.remove('selected');
    this.detailsView.draft = false;
    this.listView.elements.add.hidden = false;

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
    this.preserved = this.selected;
    this.detailsView.draft = true;
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
}
