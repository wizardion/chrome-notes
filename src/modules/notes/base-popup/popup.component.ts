import { applicationConfigs } from 'core';
import { BaseElement, IEventIntervals, IEventListener } from 'core/components';
import { ListViewElement } from '../list-view/list-view.component';
import { ListItemElement } from '../list-item/list-item.component';
import { DetailsBaseElement } from '../details-base/details-base.component';
import { INote } from '../details-base/models/details-base.model';
import { DbProviderService } from 'modules/db';
import { SortHelper } from 'modules/effects';


const INTERVALS: IEventIntervals = {
  delay: null, intervals: { changed: null, locked: null }
};

export abstract class PopupBaseElement extends BaseElement {
  protected items: INote[];
  protected selected?: INote;
  protected preserved?: number;
  protected initialized = false;
  protected listView: ListViewElement;
  protected detailsView: DetailsBaseElement;
  protected triggerDelay = applicationConfigs.delayedInterval;
  protected index = 0;

  protected listeners = new Map<'change' | 'selectionEvent' | 'save' | 'create', IEventListener>();

  protected async eventListeners() {
    SortHelper.addEventListener('start', () => ListItemElement.locked = true);
    SortHelper.addEventListener('finish', (f, s) => !this.disabled && this.onOrderChange(f, s));
  }

  init() {
    this.disabled = false;
    this.initialized = true;
    DbProviderService.init();
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
      this.listView.elements.scrollable.scrollTop =
        this.listView.elements.scrollable.scrollHeight - this.listView.elements.scrollable.offsetHeight;
    }
  }

  async select(item: INote) {
    this.detailsView.setData(item);
    this.selected?.item.classList.remove('selected');

    if (this.initialized) {
      this.selected = item;
      this.selected.item.classList.add('selected');
      await DbProviderService.cache.set<INote>('selected', this.selected);
    } else {
      this.preserved = item.id;
      this.listView.elements.create.disabled = !item.description;
    }
  }

  async delete(delay?: number): Promise<number> {
    const index = this.items.findIndex(i => i.id === this.selected.id);

    this.detailsView.elements.delete.disabled = true;

    for (let i = index + 1; i < this.items.length; i++) {
      this.items[i].item.index = i;
    }

    this.items.splice(index, 1);
    await DbProviderService.delete(this.selected);

    if (delay) {
      this.selected.item.removeItem(delay)
        .then(() => this.listView.elements.placeholder.hidden = !!this.items.length);
    } else {
      await this.selected.item.removeItem(delay);
      this.listView.elements.placeholder.hidden = !!this.items.length;
    }

    this.detailsView.elements.delete.disabled = false;
    this.listView.elements.create.disabled = false;
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

    this.listView.elements.create.disabled = true;
    this.selected?.item.classList.remove('selected');
    item.addEventListener('click', () => this.select(note));
    item.addEventListener('sort:mousedown', (e: MouseEvent) => SortHelper.start(e, this.listView.scrollable, item));
    note.id = await DbProviderService.save(note);

    this.items.push(note);
    this.listView.add(item);

    return this.select(note);
  }

  focus(): void {
    if (this.selected || this.preserved) {
      this.detailsView.focus();
    }
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

  async onChanged(e: Event) {
    if (this.selected) {
      const data = this.detailsView.getData();

      if (data.description !== this.selected.description || data.preview !== this.selected.preview) {
        const date = new Date();
        const time = date.getTime();

        this.selected.push = true;
        this.selected.updated = time;
        this.selected.item.date = date;
      }

      this.selected.title = data.title;
      this.selected.description = data.description;
      this.selected.cState = data.selection;
      this.selected.pState = data.previewSelection;
      this.selected.item.title = data.title;
      this.selected.preview = data.preview;
      this.listView.elements.create.disabled = !data.description;

      clearInterval(INTERVALS.intervals.changed);

      if (e.type === 'change') {
        INTERVALS.intervals.changed = setTimeout(async () => await this.save(this.selected), this.triggerDelay);
      } else {
        await this.save(this.selected);
      }
    }
  }

  private async save(item: INote) {
    await DbProviderService.save(item);
    await DbProviderService.cache.set<INote>('selected', item);
  }
}
