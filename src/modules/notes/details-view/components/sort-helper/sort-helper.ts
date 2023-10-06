import { 
  ISortContainer, ISortCustomEvents, ISortEventListener, ISortEventListenerType, ISortEvents, 
  ISortItem, ISortPoint 
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

  static get busy(): boolean {
    return this._busy;
  }

  static pickUp(e: MouseEvent, container: HTMLElement, element: HTMLElement) {
    const startY = (e.pageY - container.offsetTop) + container.scrollTop;
    const maxTop = element.offsetHeight * (container.childElementCount - 1);
    const index = this.buildCollection(container.children, element);

    this._busy = true;
    this.childElementCount = (container.childElementCount - 1);
    this.item = {
      index: index,
      startIndex: index,
      height: element.offsetHeight,
      element: element,
      pageY: startY - element.offsetTop,
      placeholder: this.createPlaceholder(element)
    };

    this.container = {
      offsetTop: container.offsetTop,
      scrollHeight: container.scrollHeight,
      height: container.offsetHeight,
      maxY: Math.min(maxTop, container.scrollHeight - element.offsetHeight),
      element: container
    };

    this.start(e.pageY);
    return false;
  }

  static addEventListener(type: ISortEventListenerType, listener: ISortEventListener) {
    if (type === 'finished') {
      CUSTOM_EVENTS.finish = listener;
    }
  }

  private static start(pageY: number) {
    const point: ISortPoint = this.getPoint(pageY, this.container.element.scrollTop);
    
    this.item.element.style.top = `${point.top}px`;
    this.container.element.insertBefore(this.item.placeholder, this.item.element);
    this.item.element.classList.add('drag');
    document.body.classList.add('hold');
    
    this.movingEvent = {
      move: (e: MouseEvent) => this.mouseMoveHandler(e),
      end: () => this.finish(),
      wheel: (e: MouseEvent) => e.preventDefault()
    };

    document.addEventListener('mousemove', this.movingEvent.move);
    document.addEventListener('mouseup', this.movingEvent.end);
    this.container.element.addEventListener('wheel', this.movingEvent.wheel);
  }

  private static mouseMoveHandler(e: MouseEvent) {
    const scrollTop = this.container.element.scrollTop;
    const point: ISortPoint = this.getPoint(e.pageY, scrollTop);

    // clearInterval(this.interval);

    // if (point.top >= point.max && scrollTop + this.list.height < this.list.scrollHeight) {
    //   return this.animateDown(e.pageY);
    // }

    // if (point.top <= point.min && scrollTop > 0) {
    //   return this.animateUp(e.pageY);
    // }

    this.moveItem(point.top);
  }

  private static finish() {
    this.container.element.removeEventListener('wheel', this.movingEvent.wheel);
    document.removeEventListener('mousemove', this.movingEvent.move);
    document.removeEventListener('mouseup', this.movingEvent.end);

    this.container.element.insertBefore(this.item.element, this.item.placeholder);

    //clearInterval(this.interval);
    if (this.item.index !== this.item.startIndex && CUSTOM_EVENTS.finish) {
      CUSTOM_EVENTS.finish(this.item.startIndex, this.item.index);
    }

    document.body.classList.remove('hold');
    this.item.element.classList.remove('drag');
    this.item.element.style.top = '';
    this.item.placeholder.remove();

    this.item = null;
    this.collection = null;
    this._busy = false;
  }

  private static moveItem(pageY: number) {
    const center = this.item.element.offsetTop + this.item.height / 2;
    const index = Math.max(Math.min(Math.floor(center / this.item.height), this.childElementCount), 0);

    // if (this.item.index !== index && index <= this.item.note.index) {
    if (this.item.index !== index && index <= this.item.startIndex) {
      const scrollTop = this.container.element.scrollTop;

      this.container.element.insertBefore(this.item.placeholder, this.collection[index]);
      // this.container.element.scrollTop = scrollTop;
      this.item.index = index;
    }

    // if (this.item.index !== index && index > this.item.note.index) {
    if (this.item.index !== index && index > this.item.startIndex) {
      const scrollTop = this.container.element.scrollTop;
      
      this.container.element.insertBefore(this.item.placeholder, this.collection[index].nextSibling);
      // this.container.element.scrollTop = scrollTop;
      this.item.index = index;
    }

    this.item.element.style.top = `${pageY}px`;
  }

  private static getPoint(pageY: number, scrollTop: number): ISortPoint {
    const y = (pageY - this.container.offsetTop) + scrollTop;
    const min = (scrollTop + this.container.offsetTop - this.item.height) + 0;
    const max = Math.min((scrollTop + this.container.height - this.item.height) - 0, this.container.maxY);

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

    placeholder.style.height = `${element.offsetHeight}px`;
    placeholder.style.width = `${element.offsetWidth}px`;

    return placeholder;
  }
}

