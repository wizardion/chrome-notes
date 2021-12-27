
export class ScrollListener {
  private static interval?: NodeJS.Timeout;

  public static listen(element: HTMLElement, delay=0) {
    element.classList.add('hidden-scroll');

    setTimeout(() => {
      element.addEventListener('scroll', () => this.scroll(element));
    }, delay);
  }

  private static scroll(element: HTMLElement) {
    element.classList.remove('hidden-scroll');
    clearInterval(this.interval);

    this.interval = setTimeout(() => {
      element.classList.add('hidden-scroll');
    }, 1750);
  }
}
