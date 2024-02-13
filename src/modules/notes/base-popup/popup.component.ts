import { BaseElement } from 'core/components';
import { ListViewElement } from '../list-view/list-view.component';
import { ListItemElement } from '../list-item/list-item.component';
import { DetailsBaseElement } from '../details-base/details-base.component';
import { INote } from '../details-base/details-base.model';
import { DbProviderService } from 'modules/db';
import { SortHelper } from 'modules/sort-helper';


export abstract class PopupBaseElement extends BaseElement {
  protected listView: ListViewElement;
  protected detailsView: DetailsBaseElement;
  protected selected?: INote;
  protected preserved?: INote;
  protected items: INote[];

  protected async eventListeners() {
    this.listView.addEventListener('add', () => !this.disabled && this.draft());
    this.detailsView.addEventListener('back', () => !this.disabled && this.goBack());
    this.detailsView.addEventListener('cancel', () => !this.disabled && this.goBack());
    this.detailsView.addEventListener('change', () => !this.disabled && this.onChanged());
    this.detailsView.addEventListener('create', () => !this.disabled && this.create());
    this.detailsView.addEventListener('delete', () => !this.disabled && this.delete());

    SortHelper.addEventListener('finished', (f, s) => !this.disabled && this.onItemOrderChange(f, s));
  }

  init(items: INote[]) {
    for (let i = 0; i < items.length; i++) {
      this.addItem(items[i]);
    }
  }

  addItem(note: INote) {
    const item = document.createElement('list-item') as ListItemElement;

    item.index = this.items.length + 1;
    item.title = note.title;
    item.date = new Date(note.updated);
    note.item = item;

    item.addEventListener('click', () => this.selected?.id !== note.id && this.select(note));
    item.addEventListener('sort:mousedown', (e: MouseEvent) => SortHelper.pickUp(e, this.listView.scrollable, item));
    this.listView.add(item);
    this.items.push(note);

    if (this.preserved && !this.selected && this.preserved.id === note.id) {
      this.selected = note;
      this.selected.item.classList.add('selected');
    }
  }

  select(item: INote, rendered = true) {
    this.listView.hidden = true;
    this.detailsView.hidden = false;
    this.selected?.item.classList.remove('selected');

    if (rendered) {
      this.selected = item;
      this.selected.item.classList.add('selected');
      DbProviderService.cache.set('selected', this.selected);
    } else {
      this.preserved = item;
    }

    this.detailsView.setData(item);
  }

  goBack() {
    this.onChanged();

    this.listView.hidden = false;
    this.detailsView.hidden = true;
    this.detailsView.draft = false;

    this.selected?.item.animateItem();
    this.selected = null;

    DbProviderService.cache.remove(['draft', 'selected']);
  }

  draft(title?: string, description?: string, selection?: number[]) {
    this.listView.hidden = true;
    this.detailsView.draft = true;
    this.detailsView.hidden = false;
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

  async create() {
    const item = document.createElement('list-item') as ListItemElement;
    const note: INote = this.detailsView.default();

    note.item = item;
    note.order = this.items.length;
    item.index = this.items.length + 1;
    item.title = note.title;
    item.date = new Date(note.updated);

    item.addEventListener('click', () => this.select(note));
    item.addEventListener('sort:mousedown', (e: MouseEvent) => SortHelper.pickUp(e, this.listView.list, item));

    this.listView.add(item);
    this.items.push(note);

    this.selected = note;
    this.detailsView.draft = false;

    await this.save();
    await DbProviderService.cache.remove(['draft']);
    await DbProviderService.cache.set('selected', this.selected);
  }

  async delete() {
    const index = this.items.findIndex(i => i.id === this.selected.id);
    const item = this.selected.item;

    for (let i = index + 1; i < this.listView.items.length; i++) {
      this.listView.items[i].index = i - 1;
    }

    this.items.splice(index, 1);
    this.listView.items.splice(index, 1);

    const draft = Object.assign({}, this.selected);

    delete draft.item;

    item.remove();
    await DbProviderService.remove(draft);
    this.goBack();
  }

  async save() {
    if (this.selected && !this.disabled) {
      const draft = Object.assign({}, this.selected);

      delete draft.item;

      this.selected.id = await DbProviderService.save(draft);
      DbProviderService.cache.set('selected', draft);
    }
  }

  async onItemOrderChange(first: number, second: number) {
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

  onChanged() {
    const item = this.detailsView.getData();

    if (this.selected) {
      const time = new Date().getTime();

      this.selected.title = item.title;
      this.selected.description = item.description;
      this.selected.cState = item.cState;
      this.selected.pState = item.pState;
      this.selected.item.title = item.title;
      this.selected.updated = time;
      this.selected.preview = item.preview;
      this.selected.item.date = new Date(time);

      this.save();
    } else {
      // DbProviderService.cache.set('draft', { title, description, selection });
    }
  }

  get disabled(): boolean {
    return super.disabled;
  }

  set disabled(value: boolean) {
    super.disabled = value;
    this.preserved = value ? this.preserved : null;
  }
}
