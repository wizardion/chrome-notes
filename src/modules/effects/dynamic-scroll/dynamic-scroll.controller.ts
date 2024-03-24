export const autoHideDelay = 1750;

export class DynamicScroll {
  element: HTMLElement;
  interval: NodeJS.Timeout;

  constructor(element: HTMLElement) {
    this.element = element;
    this.element.classList.add('dynamic-scroll');
  }

  toggle() {
    this.element.dataset.hiddenScroll = 'false';
    clearInterval(this.interval);

    this.interval = setTimeout(() => this.element.dataset.hiddenScroll = 'true', autoHideDelay);
  }

  public static watch(element: HTMLElement): DynamicScroll {
    return new DynamicScroll(element);
  }
}
