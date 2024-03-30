import { BaseElement, FormElement } from 'core/components';
import { IListViewForm, IListListenerType } from './models/list-view.model';
import { ListItemElement } from '../list-item/list-item.component';
import { Debounce, DynamicScroll } from 'modules/effects';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './list-view.component.html'
});

export class ListViewElement extends BaseElement {
  static readonly selector = 'list-view';

  private form: FormElement<IListViewForm>;

  constructor() {
    super();

    this.template = <HTMLElement>template.cloneNode(true);
    this.form = new FormElement<IListViewForm>({
      create: this.template.querySelector('[name="create-note"]'),
      list: this.template.querySelector('[name="list-items"]'),
      scrollable: this.template.querySelector('[name="scrollable"]'),
      placeholder: this.template.querySelector('[name="placeholder"]'),
      items: []
    });
  }

  protected eventListeners(): void {
    const watcher = DynamicScroll.watch(this.form.elements.scrollable);
    const debounced = Debounce.debounce(() => watcher.toggle());

    this.form.elements.scrollable.addEventListener('scroll', debounced, { capture: true, passive: true });
  }

  get scrollable(): HTMLElement {
    return this.form.elements.scrollable;
  }

  get list(): HTMLElement {
    return this.form.elements.list;
  }

  get items(): ListItemElement[] {
    return this.form.elements.items;
  }

  get elements(): IListViewForm {
    return this.form.elements;
  }

  add(item: ListItemElement) {
    this.form.elements.items.push(item);
    this.form.elements.list.appendChild(item);
    this.form.elements.placeholder.hidden = true;
  }

  addEventListener(type: IListListenerType, listener: EventListener, options?: boolean | AddEventListenerOptions) {
    if (type === 'create') {
      this.form.elements.create.addEventListener('mousedown', (e) => e.preventDefault());

      return this.form.elements.create.addEventListener('click', listener);
    }

    return super.addEventListener(type, listener, options);
  }
}
