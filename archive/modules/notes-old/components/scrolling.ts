interface IElementHolder {
  element: HTMLElement;
  interval: NodeJS.Timeout;
}

export class ScrollListener {
  public static listen(element: HTMLElement, delay=0) {
    var holder: IElementHolder = {
      element: element,
      interval: null,
    };

    element.classList.add('hidden-scroll');

    setTimeout(() => {
      element.addEventListener('scroll', () => this.scroll(holder));
    }, delay);
  }

  private static scroll(holder: IElementHolder) {
    holder.element.classList.remove('hidden-scroll');
    clearInterval(holder.interval);

    holder.interval = setTimeout(() => {
      holder.element.classList.add('hidden-scroll');
    }, 1750);
  }
}
