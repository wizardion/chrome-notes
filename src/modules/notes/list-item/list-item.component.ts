import './assets/list-items.scss';
import { BaseElement, FormElement, IEventListener } from 'core/components';
import { IEventListenerType, IListFormItem } from './list-item.model';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './list-item.component.html'
});

export class ListItemElement extends BaseElement {
  static readonly selector = 'list-item';
  static locked: boolean;

  private form: FormElement<IListFormItem>;
  private _index: number;
  private _title: string;
  private _date: Date;
  private listeners = new Map<'mouseup' | 'mousedown' | 'click', IEventListener>();

  constructor() {
    super();

    this.template = <HTMLElement>template.cloneNode(true);
    this.form = new FormElement<IListFormItem>({
      item: this.template.querySelector('[name="list-item"]'),
      button: this.template.querySelector('[name="to-note"]'),
      sort: this.template.querySelector('[name="sort"]'),
      index: this.template.querySelector('[name="index"]'),
      title: this.template.querySelector('[name="title"]'),
      date: this.template.querySelector('[name="date"]'),
    });
  }

  get index(): number {
    return this._index;
  }

  set index(value: number) {
    this._index = value;
    this.form.elements.index.innerText = value.toString();
  }

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    if (value) {
      this._title = value;
      this.form.elements.title.innerText = this._title.replace(/^\W+\s+/gi, '');
    } else {
      this.form.elements.title.innerHTML = '<span class="empty">empty note ...</span>';
    }
  }

  get date(): Date {
    return this._date;
  }

  set date(value: Date) {
    this._date = value;
    this.form.elements.date.innerText = value.toDateString();
  }

  animateItem() {
    const element = this.form.elements.item;

    element.scrollIntoView({ behavior: 'instant', block: 'center' });
    element.animate({
      background: 'var(--base-highlight-color)',
      color: 'var(--base-bright-color)',
      opacity: [1, 0.7],
    }, {
      fill: 'forwards',
      direction: 'reverse',
      duration: 1000,
      iterations: 1,
    });
  }

  addEventListener(type: IEventListenerType, listener: IEventListener, options?: boolean | AddEventListenerOptions) {
    if (type === 'sort:mousedown') {
      this.listeners.set('mousedown', (e) => {
        e.preventDefault();
        ListItemElement.locked = true;

        return listener(e);
      });

      return this.form.elements.sort.addEventListener('mousedown', this.listeners.get('mousedown'));
    }

    if (type === 'click') {
      this.listeners.set('click', (e) => !ListItemElement.locked && listener(e));

      return super.addEventListener('click', this.listeners.get('click'));
    }

    return super.addEventListener(type, listener, options);
  }

  removeEventListener(type: IEventListenerType): void {
    if (type === 'sort:mousedown') {
      this.form.elements.sort.removeEventListener('mousedown', this.listeners.get('mousedown'));
      this.listeners.delete('mousedown');
    }

    if (type === 'click') {
      super.removeEventListener('click', this.listeners.get('click'));
      this.listeners.delete('click');
    }
  }
}
