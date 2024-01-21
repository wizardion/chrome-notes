import './assets/list-items.scss';
import { BaseElement, FormElement } from 'core/components';
import { IEventListenerType, IListFormItem } from './list-item.model';


const template: DocumentFragment = BaseElement.component({
  templateUrl: './list-item.component.html'
});

export class ListItemElement extends BaseElement {
  static readonly selector = 'list-item';

  private form: FormElement<IListFormItem>;
  private _index: number;
  private _title: string;
  private _date: Date;
  private _locked: boolean;

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

  get offsetTop(): number {
    return this.form.elements.item.offsetTop;
  }

  get style(): CSSStyleDeclaration {
    return this.form.elements.item.style;
  }

  get classList(): DOMTokenList {
    return this.form.elements.item.classList;
  }

  animateItem() {
    const element = this.form.elements.item;

    element.scrollIntoView({ behavior: 'instant', block: 'center' });
    element.animate({
      background: 'rgba(7, 166, 152, 0.12)',
      color: 'rgb(6, 115, 106)',
      opacity: [1, 0.7],
    }, {
      fill: 'forwards',
      direction: 'reverse',
      duration: 1000,
      iterations: 1,
    });
  }

  addEventListener(type: IEventListenerType, listener: EventListener, options?: boolean | AddEventListenerOptions) {
    if (type === 'sort:mousedown') {
      document.addEventListener('mouseup', () => setTimeout(() => this._locked = false));

      return this.form.elements.sort.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this._locked = true;

        return listener(e);
      });
    }

    if (type === 'click') {
      return super.addEventListener(type, (e) => !this._locked && listener(e), options);
    }

    return super.addEventListener(type, listener, options);
  }
}
