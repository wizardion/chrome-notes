export class Validator {
  private static timer: NodeJS.Timeout;

  public static required(value: string, control?: HTMLElement): boolean {
    if (value.trim().length > 0) {
     return false; 
    }

    if (control) {
      this.animate(control, 'required');
    }

    return true;
  }

  public static animateSelected(control: HTMLElement) {
    this.animate(control, 'animate');
  }

  private static animate(control: HTMLElement, name: string) {
    if (!control.classList.contains(name)) {
      control.classList.add(name);
    } else {
      control.style.animation = 'none';
      control.offsetHeight; // trigger reflow
      control.style.animation = null;
    }

    clearInterval(this.timer);
    this.timer = setTimeout(this.removeAnimation.bind(this, control, name), 1510);
  }

  private static removeAnimation(control: HTMLElement, name: string){
    control.classList.remove(name);
  }
}
