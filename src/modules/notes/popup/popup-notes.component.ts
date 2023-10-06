import { BaseElement } from 'modules/core/base.component';
import { ListViewElement } from '../list-view/list-view.component';
import { ListItemElement } from '../list-item/list-item.component';
import { IDBNote } from 'modules/db/interfaces';
import { DetailsViewElement } from '../details-view/details-view.component';
import { DbProvider } from 'modules/db/db-provider';
import { INote } from '../details-view/details-view.model';
import { SortHelper } from '../details-view/components/sort-helper/sort-helper';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './popup-notes.component.html'
});

export class PopupNotesElement extends BaseElement {
  static readonly selector = 'popup-notes';

  private listView: ListViewElement;
  private detailsView: DetailsViewElement;
  private selected?: INote;
  private items: INote[];

  constructor() {
    super();

    this.template = <HTMLElement>template.cloneNode(true);
    this.listView = this.template.querySelector('[name="list-view"]');
    this.detailsView = this.template.querySelector('[name="details-view"]');
  }

  protected render() {
    super.render();
    
    this.listView.hidden = false;
  }

  protected async eventListeners() {
    this.listView.addEventListener('add', () => this.draft());
    this.detailsView.addEventListener('back', () => this.goBack());
    this.detailsView.addEventListener('cancel', () => this.goBack());
    this.detailsView.addEventListener('change', () => this.onChanged());
    this.detailsView.addEventListener('create', () => this.create());
    this.detailsView.addEventListener('delete', () => this.delete());
    this.detailsView.addEventListener('preview', () => this.togglePreview());
    this.detailsView.addEventListener('selectionchange', () => this.onSelectionPreviewChange());
    SortHelper.addEventListener('finished', (f, s) => this.onItemOrderChange(f, s));
  }

  init(items: IDBNote[]) {
    this.items = items;
    
    for (let i = 0; i < this.items.length; i++) {
      const note = this.items[i];
      const item = document.createElement('list-item') as ListItemElement;
      
      item.index = i + 1;
      item.title = note.title;
      item.date = new Date(note.updated);
      note.item = item;

      item.addEventListener('click', () => this.select(note));
      item.addEventListener('sort:mousedown', (e: MouseEvent) => SortHelper.pickUp(e, this.listView.list, item));
      this.listView.add(item);
    }
  }

  select(item: IDBNote, rendered = true) {
    this.listView.hidden = true;
    this.detailsView.hidden = false;

    this.selected = item;

    this.detailsView.focus();
    this.detailsView.setData({title: item.title, description: item.description, selection: item.cState});
    
    this.detailsView.preview = this.selected.preview;
    
    if (this.selected.pState) {
      this.detailsView.setPreviewState(this.selected.pState);
    }

    if (rendered) {
      DbProvider.cache.set('selected', item.id);
    }
  }

  goBack() {
    this.listView.hidden = false;
    this.detailsView.hidden = true;
    this.detailsView.draft = false;
    
    this.selected?.item.animateItem();
    this.selected = null;
    
    DbProvider.cache.remove(['draft', 'selected']);
  }

  draft(title?: string, description?: string, selection?: number[]) {
    this.listView.hidden = true;
    this.detailsView.draft = true;
    this.detailsView.hidden = false;
    this.detailsView.preview = null;
    this.selected = null;

    this.detailsView.setData({title: title || '', description: description || '', selection: selection});
  }

  togglePreview() {
    this.selected.preview = this.detailsView.togglePreview();
    this.selected.pState = this.detailsView.getPreviewState();

    this.save();
    console.log('togglePreview', [this.selected.preview, this.selected.pState]);
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
    await DbProvider.cache.remove(['draft']);
    await DbProvider.cache.set('selected', this.selected.id);
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
    await DbProvider.remove(draft, this.items);
    this.goBack();
  }

  async save() {
    if (this.selected) {
      const draft = Object.assign({}, this.selected);
      delete draft.item;

      this.selected.id = await DbProvider.save(draft);
      await DbProvider.cache.set('list', this.items);
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

    await DbProvider.bulkSave(queue, this.items);
  }

  onSelectionPreviewChange() {
    if (this.selected && this.selected.preview) {
      this.selected.pState = this.detailsView.getPreviewState();

      console.log('onSelectionChange...');
      this.save();
    }
  }

  onChanged() {
    const {title, description, selection} = this.detailsView.data;

    if (this.selected) {
      const time = new Date().getTime();

      this.selected.title = title;
      this.selected.description = description;
      this.selected.cState = selection;
      this.selected.item.title = title;
      this.selected.updated = time;
      this.selected.item.date = new Date(time);

      console.log('onChanged...');
      this.save();
    } else {
      console.log('onChanged.draft ...');
      DbProvider.cache.set('draft', {title, description, selection});
    }
  }
}
