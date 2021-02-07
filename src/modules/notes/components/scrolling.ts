
export class ScrollListener {
  private static interval?: NodeJS.Timeout;

  public static listen(element: HTMLElement) {
    element.classList.add('hidden-scroll');
    element.addEventListener('scroll', () => this.scroll(element));
  }

  private static scroll(element: HTMLElement) {
    element.classList.remove('hidden-scroll');
    clearInterval(this.interval);

    this.interval = setTimeout(() => {
      element.classList.add('hidden-scroll');
    }, 1750);
  }
}
