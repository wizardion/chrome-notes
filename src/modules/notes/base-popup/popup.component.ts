import { BaseElement } from 'core/components';
import { ListViewElement } from '../list-view/list-view.component';
import { ListItemElement } from '../list-item/list-item.component';
import { DetailsBaseElement } from '../details-base/details-base.component';
import { INote } from '../details-base/models/details-base.model';
import { DbProviderService } from 'modules/db';
import { SortHelper } from 'modules/effects';


export abstract class PopupBaseElement extends BaseElement {
  protected items: INote[];
  protected selected?: INote;
  protected preserved?: number;
  protected initialized = false;
  protected listView: ListViewElement;
  protected detailsView: DetailsBaseElement;
  protected index = 0;

  protected async eventListeners() {
    SortHelper.addEventListener('start', () => ListItemElement.locked = true);
    SortHelper.addEventListener('finish', (f, s) => !this.disabled && this.onOrderChange(f, s));
  }

  init() {
    this.disabled = false;
    this.initialized = true;
  }

  addItem(note: INote) {
    const item = document.createElement('list-item') as ListItemElement;

    note.item = item;
    item.title = note.title;
    item.index = this.items.length + 1;
    item.date = new Date(note.updated);
    this.index = Math.max(note.order, this.index);

    item.addEventListener('click', () => this.selected?.id !== note.id && this.select(note));
    item.addEventListener('sort:mousedown', (e: MouseEvent) => SortHelper.start(e, this.listView.scrollable, item));

    this.listView.add(item);
    this.items.push(note);

    if (!this.selected && this.preserved === note.id) {
      this.selected = note;
      this.preserved = null;
      this.selected.item.classList.add('selected');
      setTimeout(() => this.selected.item.scrollIntoView({ behavior: 'instant', block: 'center' }), 1);
    }
  }

  async select(item: INote) {
    this.selected?.item.classList.remove('selected');

    if (this.initialized) {
      this.selected = item;
      this.selected.item.classList.add('selected');
      await DbProviderService.cache.set('selected', this.selected);
    } else {
      this.preserved = item.id;
    }

    this.detailsView.setData(item);
  }

  async delete(delay?: number): Promise<number> {
    const index = this.items.findIndex(i => i.id === this.selected.id);

    for (let i = index + 1; i < this.items.length; i++) {
      this.items[i].item.index = i;
    }

    this.items.splice(index, 1);
    this.listView.elements.placeholder.hidden = !!this.items.length;
    await DbProviderService.delete(this.selected);

    if (delay) {
      this.selected.item.removeItem(delay);
    } else {
      await this.selected.item.removeItem(delay);
    }

    delete this.selected.item;
    this.selected = null;

    return index;
  }

  async create() {
    const item = document.createElement('list-item') as ListItemElement;
    const note = this.detailsView.default() as INote;

    this.index++;
    note.item = item;
    item.title = note.title;
    note.order = this.index;
    item.index = this.items.length + 1;
    item.date = new Date(note.updated);

    this.selected?.item.classList.remove('selected');
    item.addEventListener('click', () => this.select(note));
    item.addEventListener('sort:mousedown', (e: MouseEvent) => SortHelper.start(e, this.listView.scrollable, item));
    note.id = await DbProviderService.save(note);

    this.items.push(note);
    this.listView.add(item);

    return this.select(note);
  }

  async onOrderChange(first: number, second: number) {
    if (first !== second) {
      const queue: INote[] = [];
      const item = this.items[first];

      this.items.splice(first, 1);
      this.items.splice(second, 0, item);

      for (let i = Math.min(first, second); i <= Math.max(first, second); i++) {
        const item = this.items[i];

        item.order = i;
        item.item.index = i + 1;

        const draft = Object.assign({}, item);

        delete draft.item;

        queue.push(draft);
      }

      await DbProviderService.bulkSave(queue);
    }

    ListItemElement.locked = false;
  }

  async onChanged() {
    if (this.selected) {
      const item = this.detailsView.getData();
      const time = new Date().getTime();

      this.selected.title = item.title;
      this.selected.description = item.description;
      this.selected.cState = item.cState;
      this.selected.pState = item.pState;
      this.selected.item.title = item.title;
      this.selected.updated = time;
      this.selected.preview = item.preview;
      this.selected.item.date = new Date(time);

      await DbProviderService.save(item);
      await DbProviderService.cache.set('selected', this.selected);
    }
  }
}
