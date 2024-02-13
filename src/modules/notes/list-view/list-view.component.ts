import { BaseElement, FormElement } from 'core/components';
import { IListViewForm, IEventListenerType } from './list-view.model';
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
      add: this.template.querySelector('[name="add-note"]'),
      list: this.template.querySelector('[name="list-items"]'),
      scrollable: this.template.querySelector('[name="scrollable"]'),
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

  add(item: ListItemElement) {
    this.form.elements.items.push(item);
    this.form.elements.list.appendChild(item);
  }

  addEventListener(type: IEventListenerType, listener: EventListener, options?: boolean | AddEventListenerOptions) {
    if (type === 'add') {
      this.form.elements.add.addEventListener('mousedown', (e) => e.preventDefault());

      return this.form.elements.add.addEventListener('click', listener);
    }

    return super.addEventListener(type, listener, options);
  }
}
