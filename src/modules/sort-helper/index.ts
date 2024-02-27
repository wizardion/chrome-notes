import {
  ISortContainer, ISortCustomEvents, ISortEventListener, ISortEventListenerType, ISortEvents,
  ISortItem,
  ISortPoint,
} from './sort-helper.model';


const CUSTOM_EVENTS: ISortCustomEvents = {
  finish: null
};

export class SortHelper {
  private static _busy = false;
  private static item: ISortItem;
  private static container: ISortContainer;
  private static movingEvent: ISortEvents;
  private static childElementCount: number;
  private static collection: HTMLElement[];
  private static interval?: NodeJS.Timeout;

  static get busy(): boolean {
    return this._busy;
  }

  static addEventListener(type: ISortEventListenerType, listener: ISortEventListener) {
    if (type === 'finished') {
      CUSTOM_EVENTS.finish = listener;
    }
  }

  static start(e: MouseEvent, container: HTMLElement, element: HTMLElement) {
    const parentElement = element.parentElement;

    if (parentElement.childElementCount > 1) {
      const style = window.getComputedStyle(container);
      const startY = (e.pageY - container.offsetTop) + container.scrollTop;
      const index = this.buildCollection(parentElement.children, element);
      const border = (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);

      this._busy = true;
      this.childElementCount = (parentElement.childElementCount - 1);
      this.item = {
        index: index,
        startIndex: index,
        height: 0,
        element: element,
        pageY: startY - element.offsetTop,
        placeholder: this.createPlaceholder(element),
        offsetHeight: element.offsetHeight
      };

      this.container = {
        offsetTop: container.offsetTop,
        scrollHeight: container.scrollHeight + border,
        height: container.offsetHeight,
        maxY: container.scrollHeight - element.offsetHeight,
        parentElement: parentElement,
        element: container
      };

      this.pickUp(e.pageY);
    }

    return false;
  }

  private static pickUp(pageY: number) {
    this.container.parentElement.insertBefore(this.item.placeholder, this.item.element);
    this.item.element.classList.add('drag');
    document.body.classList.add('hold');

    this.item.height = this.item.element.offsetHeight;
    this.item.element.style.top = `${this.getPoint(pageY, this.container.element.scrollTop).top}px`;

    this.movingEvent = {
      move: (e: MouseEvent) => this.mouseMoveHandler(e),
      end: () => this.finish(),
      wheel: (e: MouseEvent) => e.preventDefault()
    };

    window.addEventListener('mousemove', this.movingEvent.move);
    document.addEventListener('mouseup', this.movingEvent.end);
    this.container.element.addEventListener('wheel', this.movingEvent.wheel);
  }

  private static finish() {
    const index = (this.item.index < this.item.startIndex) ? this.item.index : this.item.index + 1;
    const scrollTop = this.container.element.scrollTop;

    this.container.element.removeEventListener('wheel', this.movingEvent.wheel);
    window.removeEventListener('mousemove', this.movingEvent.move);
    document.removeEventListener('mouseup', this.movingEvent.end);

    this.collection.forEach(i => i.style.transform = '');
    this.container.parentElement.insertBefore(this.item.element, this.collection[index]);

    clearInterval(this.interval);

    if (this.item.index !== this.item.startIndex && CUSTOM_EVENTS.finish) {
      CUSTOM_EVENTS.finish(this.item.startIndex, this.item.index);
    }

    document.body.classList.remove('hold');
    this.item.element.classList.remove('drag');
    this.item.element.style.top = '';
    this.item.placeholder.remove();
    this.container.element.scrollTop = scrollTop;

    this.item = null;
    this.collection = null;
    this._busy = false;
  }

  private static mouseMoveHandler(e: MouseEvent) {
    const scrollTop = this.container.element.scrollTop;
    const point: ISortPoint = this.getPoint(e.pageY, scrollTop);

    clearInterval(this.interval);

    if (point.top >= point.max && scrollTop + this.container.height < this.container.scrollHeight) {
      return this.animateDown(e.pageY);
    }

    if (point.top <= point.min && scrollTop > 0) {
      return this.animateUp(e.pageY);
    }

    this.moveItem(point.top);
  }

  private static moveItem(pageY: number) {
    const center = this.item.element.offsetTop + this.item.height / 2;
    const index = Math.max(Math.min(Math.floor(center / this.item.offsetHeight), this.childElementCount), 0);

    if (this.item.index !== index) {
      const placeholderY = this.item.offsetHeight *  (index - this.item.startIndex);

      for (let i = Math.min(this.item.index, index) + 1; i <= Math.max(this.item.index, index); i++) {
        if (index === this.item.startIndex) {
          this.collection[this.item.index].style.transform = `translateY(0px)`;
        }

        if (index < this.item.startIndex) {
          const offsetTop = (index < this.item.index) ? this.item.offsetHeight : 0;

          this.collection[i - 1].style.transform = `translateY(${offsetTop}px)`;
        }

        if (index > this.item.startIndex) {
          const offsetTop = (index < this.item.index) ? 0 : this.item.offsetHeight * -1;

          this.collection[i].style.transform = `translateY(${offsetTop}px)`;
        }
      }

      this.item.placeholder.style.transform = `translateY(${placeholderY}px)`;
      this.item.index = index;
    }

    this.item.element.style.top = `${pageY}px`;
  }

  private static getPoint(pageY: number, scrollTop: number): ISortPoint {
    const y = (pageY - this.container.offsetTop) + scrollTop;
    const min = (scrollTop + this.container.offsetTop - this.item.height) + 1;
    const max = Math.min((scrollTop + this.container.height - this.item.height) - 6, this.container.maxY);

    return {
      top: Math.max(Math.min(y - this.item.pageY, max), min),
      min: min,
      max: max
    };
  }

  private static buildCollection(collection: HTMLCollection, element: HTMLElement): number {
    let current = 0;

    this.collection = [];

    for (let i = 0; i < collection.length; i++) {
      const item = <HTMLElement> collection[i];

      if (item === element) {
        current = i;
      }

      this.collection.push(item);
    }

    return current;
  }

  private static createPlaceholder(element: HTMLElement): HTMLElement {
    const placeholder = document.createElement('div');

    placeholder.classList.add('placeholder');
    placeholder.style.height = `${element.offsetHeight}px`;
    placeholder.style.width = `${element.offsetWidth}px`;

    return placeholder;
  }

  private static animateUp(pageY: number) {
    const pressure = ((this.container.offsetTop + this.item.pageY) - pageY) * 2;
    const speed = Math.max(Math.min(35 - pressure, 35), 0);

    const moveAnimatedItem = () => {
      const scrollTop = this.container.element.scrollTop - 1;

      if (!this.item || scrollTop <= 0) {
        return clearInterval(this.interval);
      }

      this.container.element.scrollTop = scrollTop;
      this.moveItem((scrollTop + this.container.offsetTop - this.item.height) + 1);
    };

    moveAnimatedItem();
    this.interval = setInterval(moveAnimatedItem, speed);
  }

  private static animateDown(pageY: number) {
    const distance = (this.item.height - this.item.pageY);
    const pressure = (pageY - (this.container.height + this.container.offsetTop - distance)) * 2;
    const speed = Math.max(Math.min(35 - pressure, 35), 1);

    const moveAnimatedItem = () => {
      const scrollTop = this.container.element.scrollTop + 1;

      if (!this.item || scrollTop + this.container.height >= this.container.scrollHeight) {
        return clearInterval(this.interval);
      }

      this.container.element.scrollTop = scrollTop;
      this.moveItem(Math.min((scrollTop + this.container.height - this.item.height) - 6, this.container.maxY));
    };

    moveAnimatedItem();
    this.interval = setInterval(moveAnimatedItem, speed);
  }
}
