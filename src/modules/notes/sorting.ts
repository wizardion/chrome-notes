import { Note } from "./note";

interface IEvents {
  move?: EventListener,
  end?: EventListener
}

interface ISelectedNote {
  note?: Note,
  index?: number,
  pageY?: number,
  height?: number,
  element?: HTMLElement,
  placeholder?: HTMLElement,
}

interface IListNote {
  top?: number,
  height?: number,
  scrollHeight?: number,
}

interface IPoint {
  top: number,
  min: number,
  max: number,
}

export class Sorting {
  public static busy: boolean = false;
  public static notes: Note[];
  public static items: HTMLElement;

  private static selected?: ISelectedNote;
  private static list?: IListNote;

  private static events?: IEvents;
  private static interval?: NodeJS.Timeout;

  public static start(note: Note, e: MouseEvent) {
    var startY = (e.pageY - this.items.offsetTop) + this.items.scrollTop;
    var noteNeight = note.element.offsetHeight;

    this.busy = true;
    this.selected = {
      note: note,
      index: note.index,
      height: noteNeight,
      element: note.element,
      pageY: startY - note.element.offsetTop,
      placeholder: <HTMLElement>note.element.cloneNode(false)
    };

    this.list = {
      top: this.items.offsetTop,
      scrollHeight: this.items.scrollHeight,
      height: this.items.offsetHeight
    };

    this.pickUp(e.pageY);
    e.preventDefault();
  }

  private static pickUp(pageY: number) {
    var point: IPoint = this.getPoint(pageY, this.items.scrollTop);
    
    this.selected.element.style.top = `${point.top}px`;
    this.items.insertBefore(this.selected.placeholder, this.selected.element);
    this.selected.element.classList.add('drag');
    document.body.classList.add('hold');
    
    this.events = {
      move: this.moveHandler.bind(this),
      end: this.endHandler.bind(this),
    };

    document.addEventListener('mousemove', this.events.move);
    document.addEventListener('mouseup', this.events.end);
  }

  private static moveHandler(e: MouseEvent) {
    var scrollTop = this.items.scrollTop;
    var point: IPoint = this.getPoint(e.pageY, scrollTop);

    clearInterval(this.interval);

    if (point.top >= point.max && scrollTop + this.list.height < this.list.scrollHeight) {
      return this.animateDown(e.pageY);
    }

    if (point.top <= point.min && scrollTop > 0) {
      return this.animateUp(e.pageY);
    }

    this.dragNote(point.top);
  }

  private static dragNote(pageY: number) {
    var center = this.selected.element.offsetTop + this.selected.height / 2;
    var index = Math.max(Math.min(Math.floor(center / this.selected.height), this.notes.length - 1), 0);
    var scrollTop = this.items.scrollTop;

    if (this.selected.index !== index && index <= this.selected.note.index) {
      this.items.insertBefore(this.selected.placeholder, this.notes[index].element);
      this.items.scrollTop = scrollTop;
      this.selected.index = index;
    }

    if (this.selected.index !== index && index > this.selected.note.index) {
      this.items.insertBefore(this.selected.placeholder, this.notes[index].element.nextSibling);
      this.items.scrollTop = scrollTop;
      this.selected.index = index;
    }

    this.selected.element.style.top = `${pageY}px`;
  }

  private static endHandler() {
    document.removeEventListener('mousemove', this.events.move);
    document.removeEventListener('mouseup', this.events.end);

    clearInterval(this.interval);
    this.replace(this.selected.note.index, this.selected.index);

    document.body.classList.remove('hold');
    this.selected.element.classList.remove('drag');
    this.selected.element.style.top = '';
    this.selected.placeholder.remove();

    this.selected = null;
    this.list = null;
    this.busy = false;
    // setTimeout(function () { this.busy = false; }.bind(this), 10);
  }

  private static replace(first: number, second: number) {
    var min = Math.min(first, second);
    var max = Math.max(first, second);
    var temp: Note = this.notes[first];

    this.notes.splice(first, 1);
    this.notes.splice(second, 0, temp);
    this.items.insertBefore(this.selected.element, this.selected.placeholder);

    for (var i = min; i <= max; i++) {
      const item = this.notes[i];
      item.index = i;
    }
  }

  private static getPoint(pageY: number, scrollTop: number): IPoint {
    var y = (pageY - this.list.top) + scrollTop;
    var min = (scrollTop + this.list.top - this.selected.height) + 3;
    var max = (scrollTop + this.list.height - this.selected.height) - 2;

    return {
      top: Math.max(Math.min(y - this.selected.pageY, max), min),
      min: min,
      max: max
    };
  }

  private static animateUp(pageY: number) {
    var presure = ((this.list.top + this.selected.pageY) - pageY) * 2;
    var speed = Math.max(Math.min(70 - presure, 70), 0);

    this.items.scrollTop--;
    this.dragNote(((this.items.scrollTop + this.list.top) + 3) - this.selected.height);

    this.interval = setInterval(function () {
      if (!this.selected || this.items.scrollTop <= 0) {
        return clearInterval(this.interval);
      }

      this.items.scrollTop--;
      this.dragNote(((this.items.scrollTop + this.list.top) + 3) - this.selected.height);
    }.bind(this), speed);
  }

  private static animateDown(pageY: number) {
    var distance = (this.selected.height - this.selected.pageY);
    var presure = (pageY - (this.list.height + this.list.top - distance)) * 2;
    var speed = Math.max(Math.min(70 - presure, 70), 1);

    this.items.scrollTop++;
    this.dragNote(((this.items.scrollTop + this.list.height) - 2) - this.selected.height);

    this.interval = setInterval(function () {
      if (!this.selected || this.items.scrollTop + this.list.height >= this.list.scrollHeight) {
        return clearInterval(this.interval);;
      }

      this.items.scrollTop++;
      this.dragNote(((this.items.scrollTop + this.list.height) - 2) - this.selected.height);
    }.bind(this), speed);
  }
}