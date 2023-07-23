export class Validator {
  private static timer: NodeJS.Timeout;

  public static required(value: string, control?: HTMLElement, time: number = 1500): boolean {
    if (value.trim().length > 0) {
      return false;
    }

    if (control) {
      this.animate(control, 'required', time);
    }

    return true;
  }

  public static animateSelected(control: HTMLElement, time: number = 1500) {
    this.animate(control, 'animate', time);
  }

  private static animate(control: HTMLElement, name: string, time: number) {
    if (!control.classList.contains(name)) {
      control.classList.add(name);
    } else {
      control.style.animation = 'none';
      control.offsetHeight; // trigger reflow
      control.style.animation = null;
    }

    clearInterval(this.timer);
    this.timer = setTimeout(this.removeAnimation.bind(this, control, name), time);
  }

  private static removeAnimation(control: HTMLElement, name: string) {
    control.classList.remove(name);
  }
}
